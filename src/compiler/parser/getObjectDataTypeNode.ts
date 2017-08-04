import * as ts from 'typescript';
import Parser from './Parser';

/**
 * If this class inherits from the Bicycle Object Type, return the core data type.
 *
 * @param node The Class Declaration to check
 * @param parser The current parser instance
 */
export default function getObjectDataTypeNode(
  node: ts.ClassDeclaration,
  parser: Parser,
): null | ts.TypeNode {
  const heritageClauses = node.heritageClauses;
  if (!heritageClauses) {
    return null;
  }
  for (const clause of heritageClauses) {
    if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
      for (const {expression, typeArguments} of clause.types) {
        if (typeArguments && typeArguments.length === 1) {
          const type = parser.checker.getTypeAtLocation(expression);
          if (isObjectDataType(type)) {
            return typeArguments[0];
          }
        }
      }
    }
  }
  return null;
}
export function isObjectDataType(type: ts.Type) {
  return type.getApparentProperties().some(p => {
    if (p.name !== '__@toStringTag') return false;
    const valueDeclaration = p.valueDeclaration;
    if (!(valueDeclaration && ts.isPropertyDeclaration(valueDeclaration)))
      return false;
    const type = valueDeclaration.type;
    if (!(type && ts.isLiteralTypeNode(type))) return false;
    const literal = type.literal;
    return (
      ts.isStringLiteral(literal) && literal.text === 'BicycleSchemaObject'
    );
  });
}
