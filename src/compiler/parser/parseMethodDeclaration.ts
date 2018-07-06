import * as ts from 'typescript';
import {ParsedMethod} from '../ParsedObject';
import Parser from './Parser';
import getSchemaFromType from './getSchemaFromType';
import SchemaKind from 'bicycle/types/SchemaKind';

export default function parseMethodDeclaration(
  method: ts.MethodDeclaration,
  parser: Parser,
): ParsedMethod {
  if (!ts.isIdentifier(method.name)) {
    throw parser.createError(
      'Expected method name to be an identifier.',
      method.name,
    );
  }
  const name = method.name.text;
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
          !parser.result.context.some(
            c => c.fileName === fileName && c.exportName === exportName,
          )
        ) {
          parser.result.context.push({fileName, exportName});
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
