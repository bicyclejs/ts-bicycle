import * as ts from 'typescript';
import createError from './createError';
import getObjectDataTypeNode from './getObjectDataTypeNode';
import getSchemaFromType from './getSchemaFromType';
import Parser from './Parser';
import AST from '../AST';
import {ParsedMethod} from '../ParsedObject';
import SchemaKind from 'bicycle/types/SchemaKind';
import {isIntersectionType, isEnumType} from './TypeUtils';
import {ScalarName, ScalarInfo, scalarID} from './Scalars';

export default function parseSchema(
  fileNames: string[],
  options: ts.CompilerOptions,
): AST {
  const result: AST = {classes: {}, context: [], scalars: {}};
  const parser = new Parser(fileNames, options);

  const scalarInfoByAlias = new Map<ScalarName, ScalarInfo>();
  const scalarExportName = new Map<ScalarName, string>();
  // Visit every sourceFile in the program
  const fileNamesSet = new Set(fileNames.map(n => n.toLowerCase()));
  for (const sourceFile of parser.program.getSourceFiles()) {
    if (fileNamesSet.has(sourceFile.fileName.toLowerCase())) {
      // Walk the tree to search for classes
      ts.forEachChild(sourceFile, visitScalars);
    }
  }
  for (const sourceFile of parser.program.getSourceFiles()) {
    if (fileNamesSet.has(sourceFile.fileName.toLowerCase())) {
      // Walk the tree to search for classes
      ts.forEachChild(sourceFile, visitClasses);
    }
  }
  return result;

  /** visit nodes finding exported classes */

  function visitScalars(node: ts.Node) {
    if (ts.isFunctionDeclaration(node)) {
      visitFunctionDeclartion(node);
    }
    if (ts.isTypeAliasDeclaration(node)) {
      visitTypeAliasDeclaration(node);
    }
    if (ts.isExportAssignment(node)) {
      visitExportAssignment(node);
    }
    ts.forEachChild(node, visitScalars);
  }
  function visitClasses(node: ts.Node) {
    if (ts.isClassDeclaration(node)) {
      visitClassDeclaration(node);
    }
    ts.forEachChild(node, visitClasses);
  }

  function getScalarInfo(typeNode: ts.TypeNode, nameNode?: ts.Identifier): ScalarInfo | void {
    const type = parser.checker.getTypeFromTypeNode(typeNode);
    if (isIntersectionType(type) && type.types.length === 2) {
      const [a, b] = type.types;
      const brand = isEnumType(a) ? a : isEnumType(b) ? b : undefined;
      if (brand) {
        // TODO:
        const baseType = parser.withLoc(
          () => getSchemaFromType(brand === a ? b : a, parser),
          typeNode,
        );
        const brandName = brand.symbol && brand.symbol.name;
        if (brandName) {
          return {brandName, baseType, loc: parser.getLocation(nameNode || typeNode), node: nameNode || typeNode};
        }
      }
    }
  }
  function visitTypeAliasDeclaration(node: ts.TypeAliasDeclaration) {
    const scalar = getScalarInfo(node.type, node.name);
    if (scalar) {
      const scalarName = (node.name.text as ScalarName);
      parser.scalarNames.set(scalarID(scalar), scalarName);
      scalarInfoByAlias.set(scalarName, scalar);
      const isExported =
        node.modifiers &&
        node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
      const isDefaultExport =
        node.modifiers &&
        node.modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
      if (isExported) {
        scalarExportName.set(scalarName, isDefaultExport ? 'default' : scalarName);
      }
    }
  }
  function visitExportAssignment(node: ts.ExportAssignment) {
    // TODO: node.exportEquals
    if (ts.isIdentifier(node.expression)) {
      const name = (node.expression.text as ScalarName);
      const info = scalarInfoByAlias.get(name)
      if (info && info.loc.fileName === parser.getLocation(node).fileName) {
        scalarExportName.set(name, 'default');
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
    const dataType = getObjectDataTypeNode(node, parser);
    if (!dataType) {
      // does not extend `Object`, ignoring
      return;
    }

    if (!node.name) {
      throw createError(
        `You cannot use an anonymous class as an object type in a bicycle schema.`,
        node,
      );
    }
    const className = node.name.text;
    if (className in result.classes) {
      throw createError(
        `Duplicate declaration for class ${className}`,
        node.name,
      );
    }
    if (
      !node.modifiers ||
      !node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      throw createError(
        `${className} is not exported, you must export any Bicycle Schema Objects`,
        node.name,
      );
    }
    const isDefaultExport = node.modifiers.some(
      m => m.kind === ts.SyntaxKind.DefaultKeyword,
    );
    const methods = node.members.filter(isMethodDeclaration);
    const instanceMethods = methods.filter(e => !isStatic(e));
    const staticMethods = methods.filter(e => isStatic(e));

    const data = parser.withLoc(
      () =>
        getSchemaFromType(parser.checker.getTypeFromTypeNode(dataType), parser),
      dataType,
    );
    const methodSchemas = convertMethodsToSchema(instanceMethods);

    let idName = 'id';
    let propertyAuth = {};
    let staticAuth = {};
    node.members.forEach(member => {
      if (ts.isPropertyDeclaration(member) && ts.isIdentifier(member.name)) {
        if (member.name.text === '$id') {
          if (!member.initializer || !ts.isStringLiteral(member.initializer)) {
            throw createError(
              'The $id must be initialised with a string literal.',
              member.initializer || member,
            );
          }
          idName = member.initializer.text;
          if (
            !(idName in methodSchemas) &&
            !(data.kind === SchemaKind.Object && idName in data.properties)
          ) {
            throw createError(
              `The name "${idName}" is not one of the properties of ${className}.`,
              member.initializer,
            );
          }
        }
        if (member.name.text === '$auth') {
          if (
            !member.initializer ||
            !ts.isObjectLiteralExpression(member.initializer)
          ) {
            throw createError(
              'The $auth must be initialised with an object literal.',
              member.initializer || member,
            );
          }
          const auth = {};
          const seenElements: Set<string> = new Set();
          member.initializer.properties.forEach(property => {
            if (!ts.isPropertyAssignment(property)) {
              throw createError(
                'Property in $auth must be a plain property with array as the value.',
                property,
              );
            }
            if (!property.name || !ts.isIdentifier(property.name)) {
              throw createError(
                'Property name in $auth must be an identifier.',
                property.name || property,
              );
            }
            const groupName = property.name.text;
            if (!ts.isArrayLiteralExpression(property.initializer)) {
              throw createError(
                'Property value in $auth must be an array literal.',
                property.initializer,
              );
            }
            property.initializer.elements.forEach(element => {
              if (!ts.isStringLiteral(element)) {
                throw createError(
                  'Property value in $auth must be an array of string literals.',
                  element,
                );
              }
              const propertyName = element.text;
              if (seenElements.has(propertyName)) {
                throw createError(
                  'Property value in $auth must only be in one auth category.',
                  element,
                );
              }
              seenElements.add(propertyName);
              auth[propertyName] = groupName;
              return propertyName;
            });
          });
          if (isStatic(member)) {
            staticAuth = auth;
          } else {
            propertyAuth = auth;
          }
        }
      }
    });
    if (
      className !== 'Root' &&
      !(idName in methodSchemas) &&
      !(data.kind === SchemaKind.Object && idName in data.properties)
    ) {
      throw createError(
        `There is no property called "id" in the properties of ${className}. Either add one, or provide \n` +
          `the idName property to override the default. e.g.\`idName = "myProperty";\``,
        node,
      );
    }
    result.classes[className] = {
      exportedName: isDefaultExport ? 'default' : className,
      loc: parser.getLocation(node),
      idName,
      data,
      methods: methodSchemas,
      staticMethods: convertMethodsToSchema(staticMethods),
      auth: propertyAuth,
      staticAuth,
    };
  }
  function convertMethodsToSchema(
    methods: ts.MethodDeclaration[],
  ): {[key: string]: ParsedMethod} {
    const results: {[key: string]: ParsedMethod} = {};
    methods.forEach(method => {
      if (!ts.isIdentifier(method.name)) {
        return;
      }
      const paramType = method.parameters[0] && method.parameters[0].type;
      const ctxType = method.parameters[1] && method.parameters[1].type;
      if (ctxType) {
        const contextSymbol = parser.checker.getTypeFromTypeNode(ctxType)
          .symbol;
        if (contextSymbol) {
          const parent: ts.Symbol | void = (contextSymbol as any).parent;
          if (parent && parent.flags & ts.SymbolFlags.Module) {
            const fileName = JSON.parse(parent.name);
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
      results[method.name.text] = {
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
    });
    return results;
  }
}

function isStatic(e: ts.ClassElement): boolean {
  return !!(
    e.modifiers &&
    e.modifiers.some(token => token.kind === ts.SyntaxKind.StaticKeyword)
  );
}

function isMethodDeclaration(e: ts.ClassElement): e is ts.MethodDeclaration {
  return e.kind === ts.SyntaxKind.MethodDeclaration;
}
