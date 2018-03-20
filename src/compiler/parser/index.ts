import {realpathSync} from 'fs';
import * as ts from 'typescript';
import getObjectDataTypeNode from './getObjectDataTypeNode';
import getSchemaFromType from './getSchemaFromType';
import Parser from './Parser';
import AST from '../AST';
import {ParsedMethod, ResolvedAPI} from '../ParsedObject';
import SchemaKind from 'bicycle/types/SchemaKind';
import {LocationInfo} from 'bicycle/types/ValueType';
import {isIntersectionType, isEnumType, isObjectType} from './TypeUtils';
import {ScalarName, ScalarInfo, scalarID} from './Scalars';

export default function parseSchema(
  fileNames: string[],
  options: ts.CompilerOptions,
): AST {
  const result: AST = {
    programFiles: [],
    classes: {},
    context: [],
    scalars: {},
    enums: {},
  };
  const parser = new Parser(fileNames, options);

  const scalarInfoByAlias = new Map<ScalarName, ScalarInfo>();
  const scalarExportName = new Map<ScalarName, string>();
  // Visit every sourceFile in the program
  const fileNamesSet = new Set(fileNames.map(n => n.toLowerCase()));
  for (const sourceFile of parser.program.getSourceFiles()) {
    result.programFiles.push(realpathSync(sourceFile.fileName));
    if (fileNamesSet.has(sourceFile.fileName.toLowerCase())) {
      // Walk the tree to search for scalars and enums
      ts.forEachChild(sourceFile, visitScalarsAndEnums);
    }
  }
  for (const sourceFile of parser.program.getSourceFiles()) {
    if (fileNamesSet.has(sourceFile.fileName.toLowerCase())) {
      // Walk the tree to search for classes
      ts.forEachChild(sourceFile, visitClasses);
    }
  }
  result.programFiles.sort();
  return result;

  /** visit nodes finding exported classes */

  function visitScalarsAndEnums(node: ts.Node) {
    if (ts.isFunctionDeclaration(node)) {
      visitFunctionDeclartion(node);
    }
    if (ts.isTypeAliasDeclaration(node)) {
      visitTypeAliasDeclaration(node);
    }
    if (ts.isEnumDeclaration(node)) {
      visitEnumDeclaration(node);
    }
    if (ts.isExportAssignment(node)) {
      visitExportAssignment(node);
    }
    ts.forEachChild(node, visitScalarsAndEnums);
  }
  function visitClasses(node: ts.Node) {
    if (ts.isClassDeclaration(node)) {
      visitClassDeclaration(node);
    }
    ts.forEachChild(node, visitClasses);
  }

  function getScalarInfo(
    typeNode: ts.TypeNode | ts.EnumDeclaration,
    nameNode?: ts.Identifier,
  ): ScalarInfo | void {
    if (typeNode.kind === ts.SyntaxKind.EnumDeclaration) {
      if (nameNode) {
        return {
          brandName: nameNode.text,
          baseType: {kind: SchemaKind.Any},
          loc: parser.getLocation(nameNode || typeNode),
          node: nameNode || typeNode,
        };
      }
    } else {
      const type = parser.checker.getTypeFromTypeNode(typeNode);
      if (isIntersectionType(type) && type.types.length === 2) {
        const [a, b] = type.types;
        const brand = isEnumType(a) ? a : isEnumType(b) ? b : undefined;
        if (brand) {
          const baseType = parser.withLoc(
            () => getSchemaFromType(brand === a ? b : a, parser),
            typeNode,
          );
          const brandName = brand.symbol && brand.symbol.name;
          if (brandName) {
            return {
              brandName,
              baseType,
              loc: parser.getLocation(nameNode || typeNode),
              node: nameNode || typeNode,
            };
          }
        }
      } else if (isEnumType(type)) {
        const brandName = type.symbol && type.symbol.name;
        if (brandName) {
          return {
            brandName,
            baseType: {kind: SchemaKind.Any},
            loc: parser.getLocation(nameNode || typeNode),
            node: nameNode || typeNode,
          };
        }
      }
    }
  }
  function visitTypeAliasDeclaration(node: ts.TypeAliasDeclaration) {
    const scalar = getScalarInfo(node.type, node.name);
    if (scalar) {
      const scalarName = node.name.text as ScalarName;
      parser.scalarNames.set(scalarID(scalar), scalarName);
      scalarInfoByAlias.set(scalarName, scalar);
      const isExported =
        node.modifiers &&
        node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
      const isDefaultExport =
        node.modifiers &&
        node.modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
      if (isExported) {
        scalarExportName.set(
          scalarName,
          isDefaultExport ? 'default' : scalarName,
        );
      }
    }
  }
  function visitEnumDeclaration(node: ts.EnumDeclaration) {
    const isExported =
      node.modifiers &&
      node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
    const isDefaultExport =
      node.modifiers &&
      node.modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
    result.enums[node.name.text] = {
      name: node.name.text,
      exportName: isExported
        ? isDefaultExport ? 'default' : node.name.text
        : 'UNKNOWN',
      location: parser.getLocation(node),
    };
    const scalar = getScalarInfo(node, node.name);
    if (scalar && !parser.scalarNames.has(scalarID(scalar))) {
      const scalarName = scalar.brandName as ScalarName;
      parser.scalarNames.set(scalarID(scalar), scalarName);
      scalarInfoByAlias.set(scalarName, scalar);
      if (isExported) {
        scalarExportName.set(
          scalarName,
          isDefaultExport ? 'default' : scalarName,
        );
      }
    }
  }
  function visitExportAssignment(node: ts.ExportAssignment) {
    // TODO: node.exportEquals
    if (ts.isIdentifier(node.expression)) {
      const name = node.expression.text as ScalarName;
      const info = scalarInfoByAlias.get(name);
      if (info && info.loc.fileName === parser.getLocation(node).fileName) {
        scalarExportName.set(name, 'default');
      }
      if (node.expression.text in result.enums) {
        const loc = parser.getLocation(node);
        if (
          loc.fileName === result.enums[node.expression.text].location.fileName
        ) {
          result.enums[node.expression.text].exportName = 'default';
        }
      }
    }
  }
  function visitFunctionDeclartion(node: ts.FunctionDeclaration) {
    const functionName = node.name && node.name.text;
    if (functionName && node.type && ts.isTypePredicateNode(node.type)) {
      const isDefaultExport =
        node.modifiers &&
        node.modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
      const scalar = getScalarInfo(node.type.type);
      if (scalar) {
        const alias = parser.scalarNames.get(scalarID(scalar));
        if (alias) {
          const exportName = scalarExportName.get(alias);
          if (exportName) {
            result.scalars[alias] = {
              type: scalar.baseType,
              brandName: scalar.brandName,
              name: alias,
              exportName,
              aliasLocation: parser.getLocation(node),
              validatorName: isDefaultExport ? 'default' : functionName,
              validatorLocation: parser.getLocation(node),
            };
          }
        }
      }
    }
  }
  function visitClassDeclaration(node: ts.ClassDeclaration) {
    const dataTypeNode = getObjectDataTypeNode(node, parser);
    if (!dataTypeNode) {
      // does not extend `Object`, ignoring
      return;
    }

    if (!node.name) {
      throw parser.createError(
        `You cannot use an anonymous class as an object type in a bicycle schema.`,
        node,
      );
    }
    const className = node.name.text;
    if (className in result.classes) {
      throw parser.createError(
        `Duplicate declaration for class ${className}`,
        node.name,
      );
    }
    if (
      !node.modifiers ||
      !node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      throw parser.createError(
        `${className} is not exported, you must export any Bicycle Schema Objects`,
        node.name,
      );
    }
    const isDefaultExport = node.modifiers.some(
      m => m.kind === ts.SyntaxKind.DefaultKeyword,
    );

    const idName = getIdName(node);
    const instanceAPI = resolveAPI(
      node.members.filter(e => !isStatic(e)),
      idName,
    );
    const staticAPI = resolveAPI(node.members.filter(e => isStatic(e)));

    const dataType = parser.checker.getTypeFromTypeNode(dataTypeNode);
    const properties = (instanceAPI.properties = {});
    if (isObjectType(dataType)) {
      dataType.getProperties().forEach(p => {
        if (
          (p.name === idName.name || p.name in instanceAPI.auth) &&
          !(p.name in instanceAPI.methods)
        ) {
          if (
            p.valueDeclaration &&
            ts.isPropertySignature(p.valueDeclaration) &&
            p.valueDeclaration.type
          ) {
            const v = p.valueDeclaration;
            const t = p.valueDeclaration.type;
            properties[p.name] = parser.withLoc(
              () =>
                getSchemaFromType(
                  parser.checker.getTypeFromTypeNode(t),
                  parser,
                ),
              v,
            );
            if (p.flags & ts.SymbolFlags.Optional) {
              properties[p.name] = parser.withLoc(
                () => ({
                  kind: SchemaKind.Union,
                  elements: [properties[p.name], {kind: SchemaKind.Void}],
                }),
                v,
              );
              // see code-gen/generateType for the nasty hack
              (properties[p.name] as any).isOptional = true;
            }
          }
        }
      });
    }
    if (
      className !== 'Root' &&
      !(idName.name in properties) &&
      !(idName.name in instanceAPI.methods)
    ) {
      throw parser.createError(
        `Could not find a property called "${
          idName.name
        }" in ${className}. Either define an ` +
          `id property called "${
            idName.name
          }" that returns a unique string for each object, ` +
          `or set the "idName" property to a property name that exists for your object.`,
        idName.loc,
      );
    }

    result.classes[className] = {
      exportedName: isDefaultExport ? 'default' : className,
      loc: parser.getLocation(node),
      idName: idName.name,
      instanceAPI,
      staticAPI,
    };
  }
  function hasMethod(elements: ts.ClassElement[], name: string) {
    return elements.some(member => {
      return (
        ts.isMethodDeclaration(member) &&
        ts.isIdentifier(member.name) &&
        member.name.text === name
      );
    });
  }
  function resolveAPI(
    members: ts.ClassElement[],
    idName?: {name: string; loc: LocationInfo},
  ): ResolvedAPI {
    const authMethodNames = new Set<string>();
    const exposedMethods = new Set<string>();
    const auth: {[propertyName: string]: string} = {};
    const authMethods: {[key: string]: ParsedMethod} = {};
    const methods: {[key: string]: ParsedMethod} = {};
    members.forEach(member => {
      if (ts.isPropertyDeclaration(member) && ts.isIdentifier(member.name)) {
        if (member.name.text === '$auth') {
          if (
            !member.initializer ||
            !ts.isObjectLiteralExpression(member.initializer)
          ) {
            throw parser.createError(
              'The $auth must be initialised with an object literal.',
              member.initializer || member,
            );
          }
          member.initializer.properties.forEach(property => {
            if (!ts.isPropertyAssignment(property)) {
              throw parser.createError(
                'Property in $auth must be a plain property with array as the value.',
                property,
              );
            }
            if (!property.name || !ts.isIdentifier(property.name)) {
              throw parser.createError(
                'Property name in $auth must be an identifier.',
                property.name || property,
              );
            }
            const groupName = property.name.text;
            authMethodNames.add('$' + groupName);
            if (
              groupName !== 'public' &&
              !hasMethod(members, '$' + groupName)
            ) {
              throw parser.createError(
                `Could not find an implementation for $${groupName}`,
                property.name,
              );
            }
            if (!ts.isArrayLiteralExpression(property.initializer)) {
              throw parser.createError(
                'Property value in $auth must be an array literal.',
                property.initializer,
              );
            }
            property.initializer.elements.forEach(element => {
              if (!ts.isStringLiteral(element)) {
                throw parser.createError(
                  'Property value in $auth must be an array of string literals.',
                  element,
                );
              }
              const propertyName = element.text;
              if (auth[propertyName]) {
                throw parser.createError(
                  `"${propertyName} is in $auth categories of "${
                    auth[propertyName]
                  }" and ` +
                    `"${groupName}". We can't tell whether you expected us to require users ` +
                    `to match "${auth[propertyName]} && ${groupName}" or ` +
                    `"${
                      auth[propertyName]
                    } || ${groupName}". You need to be explicit. ` +
                    `You could set up a new group like: \n\n` +
                    `async $${
                      auth[propertyName]
                    }And${groupName[0].toUpperCase() +
                      groupName.substr(1)}(args: any, ctx: Context) {\n` +
                    `  return (await this.$${
                      auth[propertyName]
                    }(args, ctx)) && (await this.$${groupName}(args, ctx));\n` +
                    `}`,
                  element,
                );
              }
              auth[propertyName] = groupName;
              exposedMethods.add(propertyName);
              return propertyName;
            });
          });
        }
      }
    });
    members.forEach(member => {
      if (ts.isMethodDeclaration(member) && ts.isIdentifier(member.name)) {
        const name = member.name.text;
        if (authMethodNames.has(name)) {
          authMethods[name] = convertMethodToSchema(member, name);
        }
        if (exposedMethods.has(name) || (idName && idName.name === name)) {
          methods[name] = convertMethodToSchema(member, name);
        }
      }
    });
    return {auth, authMethods, methods};
  }
  function getIdName(
    node: ts.ClassDeclaration,
  ): {name: string; loc: LocationInfo} {
    const result = {name: 'id', loc: parser.getLocation(node.name || node)};
    node.members.forEach(member => {
      if (ts.isPropertyDeclaration(member) && ts.isIdentifier(member.name)) {
        if (member.name.text === '$id') {
          if (!member.initializer || !ts.isStringLiteral(member.initializer)) {
            throw parser.createError(
              'The $id must be initialised with a string literal.',
              member.initializer || member,
            );
          }
          result.name = member.initializer.text;
          result.loc = parser.getLocation(member.initializer || member);
        }
      }
    });
    return result;
  }
  function convertMethodToSchema(
    method: ts.MethodDeclaration,
    name: string,
  ): ParsedMethod {
    const paramType = method.parameters[0] && method.parameters[0].type;
    const ctxType = method.parameters[1] && method.parameters[1].type;
    if (ctxType) {
      const contextSymbol = parser.checker.getTypeFromTypeNode(ctxType).symbol;
      if (contextSymbol) {
        const parent: ts.Symbol | void = (contextSymbol as any).parent;
        if (parent && parent.flags & ts.SymbolFlags.Module) {
          const rawFileName = JSON.parse(parent.name);
          const fileName =
            parser.fileNames.get(rawFileName.toLowerCase()) || rawFileName;
          const exportName = contextSymbol.name;
          if (
            !result.context.some(
              c => c.fileName === fileName && c.exportName === exportName,
            )
          ) {
            result.context.push({fileName, exportName});
          }
        }
        // TODO: warn if we can't find the context
      }
    }
    const methodType = method.type;
    const length = method.parameters.length;
    return {
      name,
      args: paramType
        ? parser.withLoc(
            () =>
              getSchemaFromType(
                parser.checker.getTypeFromTypeNode(paramType),
                parser,
              ),
            paramType,
          )
        : {kind: SchemaKind.Void},
      result: methodType
        ? parser.withLoc(
            () =>
              getSchemaFromType(
                parser.checker.getTypeFromTypeNode(methodType),
                parser,
              ),
            methodType,
          )
        : {kind: SchemaKind.Void},
      length,
    };
  }
}

function isStatic(e: ts.ClassElement): boolean {
  return !!(
    e.modifiers &&
    e.modifiers.some(token => token.kind === ts.SyntaxKind.StaticKeyword)
  );
}
