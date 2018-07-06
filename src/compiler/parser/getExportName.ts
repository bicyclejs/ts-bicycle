import ts from 'typescript';
import Parser from './Parser';
import getSourceFile from './getSourceFile';

export function tryGetExportName(
  node: ts.NamedDeclaration,
  parser: Parser,
): string | null {
  try {
    return getExportName(node, parser);
  } catch (ex) {
    return null;
  }
}

export default function getExportName(
  node: ts.NamedDeclaration,
  parser: Parser,
): string {
  const isExported =
    node.modifiers &&
    node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
  const isDefaultExport =
    node.modifiers &&
    node.modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
  if (isDefaultExport) {
    return 'default';
  }
  if (!node.name || !ts.isIdentifier(node.name)) {
    throw parser.createError(
      'Cannot find export name for this declaration',
      node.name || node,
    );
  }
  const name = node.name.text;
  if (isExported) {
    return name;
  }
  const sourceFile = getSourceFile(node);
  if (!sourceFile) {
    throw parser.createError('Cannot find source file', node);
  }
  const moduleSymbol = parser.checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) {
    throw parser.createError('Cannot find symbol', sourceFile);
  }
  const exports = parser.checker
    .getExportsOfModule(moduleSymbol)
    .filter(exp => {
      const localSymbol = parser.checker.getAliasedSymbol(exp);
      return (
        localSymbol.declarations &&
        localSymbol.declarations.some(d => d === node)
      );
    });
  if (exports.length === 0) {
    throw parser.createError('Cannot find export for declaration', node);
  }
  if (exports.length === 1) {
    return exports[0].name;
  }
  for (let exp of exports) {
    if (exp.name === 'default') {
      return 'default';
    }
  }
  return exports[0].name;
}
