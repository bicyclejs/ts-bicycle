import {realpathSync} from 'fs';
import ts from 'typescript';
import getSchemaFromType from './getSchemaFromType';
import Parser from './Parser';
import AST from '../AST';
import SchemaKind from 'bicycle/types/SchemaKind';
import {isIntersectionType, isEnumType} from './TypeUtils';
import {ScalarName, ScalarInfo, scalarID} from './Scalars';
import parseEnumDeclaration from './parseEnumDeclaration';
import {tryGetExportName} from './getExportName';
import parseClassDeclaration from './parseClassDeclaration';

export default function parseSchema(
  fileNames: string[],
  options: ts.CompilerOptions,
): AST {
  const parser = new Parser(fileNames, options, visitEnumDeclaration);
  const result = parser.result;

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
  parser.modernScalars.forEach(scalar => {
    result.scalars[scalar.name] = {
      type: scalar.baseType,
      brandName: scalar.name,
      name: scalar.name,
      exportName: scalar.exportName,
      aliasLocation: scalar.loc,
      validatorName: scalar.exportName + '.isValid',
      validatorLocation: scalar.loc,
    };
  });
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
      const scalarName = parser.renameScalar(scalarID(scalar), node.name.text);
      scalarInfoByAlias.set(scalarName, scalar);
      const exportedName = tryGetExportName(node, parser);
      if (exportedName) {
        scalarExportName.set(scalarName, exportedName);
      }
    }
  }
  function visitEnumDeclaration(node: ts.EnumDeclaration) {
    const e = parseEnumDeclaration(node, parser);
    if (e) {
      result.enums[e.name] = e;
    }
    const scalar = getScalarInfo(node, node.name);
    if (scalar && !parser.scalarNames.has(scalarID(scalar))) {
      const scalarName = parser.renameScalar(
        scalarID(scalar),
        scalar.brandName,
      );
      scalarInfoByAlias.set(scalarName, scalar);
      const exportName = tryGetExportName(node, parser);
      if (exportName && !scalarExportName.has(scalarName)) {
        scalarExportName.set(scalarName, exportName);
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
      const scalar = getScalarInfo(node.type.type);
      if (scalar) {
        const alias = parser.scalarNames.get(scalarID(scalar));
        if (alias) {
          const exportName = scalarExportName.get(alias);
          const validatorName = tryGetExportName(node, parser);
          if (exportName && validatorName) {
            result.scalars[alias] = {
              type: scalar.baseType,
              brandName: scalar.brandName,
              name: alias,
              exportName,
              aliasLocation: parser.getLocation(node),
              validatorName,
              validatorLocation: parser.getLocation(node),
            };
          }
        }
      }
    }
  }
  function visitClassDeclaration(node: ts.ClassDeclaration) {
    const classDeclaration = parseClassDeclaration(node, parser);
    if (classDeclaration) {
      result.classes[classDeclaration.className] = classDeclaration.classData;
    }
  }
}
