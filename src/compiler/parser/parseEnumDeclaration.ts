import * as ts from 'typescript';
import {tryGetExportName} from './getExportName';
import Parser from './Parser';

export default function parseEnumDeclaration(
  node: ts.EnumDeclaration,
  parser: Parser,
) {
  const exportName = tryGetExportName(node, parser);
  return (
    exportName && {
      name: node.name.text,
      exportName,
      location: parser.getLocation(node),
    }
  );
}
