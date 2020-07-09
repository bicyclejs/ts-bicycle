import {resolve} from 'path';
import * as ts from 'typescript';
import ValueType, {LocationInfo} from 'bicycle/types/ValueType';
import Parser from './Parser';
import {ScalarID, ScalarName} from './ScalarTypes';
import getSchemaFromType from './getSchemaFromType';

export {ScalarID, ScalarName};

export interface ScalarInfo {
  brandName: string;
  baseType: ValueType;
  loc: LocationInfo;
  node: ts.Node;
}
export function scalarID(info: ScalarInfo): ScalarID {
  return ScalarID.unsafeCast(
    info.brandName + ' at ' + resolve(info.loc.fileName),
  );
}
export function scalarIDFromBrand(
  brand: ts.EnumType,
  parser: Parser,
): ScalarID | void {
  const name = brand.symbol && brand.symbol.name;
  const declaration = brand.symbol && brand.symbol.valueDeclaration;
  if (name && declaration) {
    const loc = parser.getLocation(declaration);
    return ScalarID.unsafeCast(name + ' at ' + resolve(loc.fileName));
  }
}

export interface ModernScalarInfo {
  name: ScalarName;
  baseType: ValueType;
  loc: LocationInfo;
  exportName: string;
}
export function scalarIDFromSymbol(
  aliasSymbol: ts.Symbol,
  declaration: ts.Declaration,
  parser: Parser,
): ScalarID | void {
  const baseTags = ts
    .getJSDocTags(declaration)
    .filter(t => t.tagName.text === 'base');
  if (baseTags.length !== 1) {
    return;
  }
  const baseTag = baseTags[0];
  if (!baseTag.comment) {
    return;
  }
  const baseType = baseTag.comment.trim();

  const loc = parser.getLocation(declaration);
  const id = ScalarID.unsafeCast(
    aliasSymbol.escapedName + ' at ' + resolve(loc.fileName),
  );
  const escapedName = aliasSymbol.getEscapedName();
  if (typeof escapedName === 'string') {
    const name = parser.getScalarName(id, escapedName);
    let root: ts.Node = declaration;
    while (root.parent && root.parent !== root) {
      root = root.parent;
    }
    if (!ts.isSourceFile(root)) {
      return;
    }
    const base = root.statements.filter(
      (statement): statement is ts.TypeAliasDeclaration =>
        ts.isTypeAliasDeclaration(statement) &&
        statement.name.text === baseType,
    );
    if (base.length !== 1) {
      return;
    }
    const isExported =
      declaration.modifiers &&
      declaration.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
    const isDefaultExport =
      declaration.modifiers &&
      declaration.modifiers.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
    let exportName = isDefaultExport
      ? 'default'
      : isExported
        ? escapedName
        : '';
    if (!exportName) {
      root.statements.forEach(statement => {
        if (ts.isExportAssignment(statement)) {
          if (statement.isExportEquals) {
            throw parser.createError(
              'Unexpected `export=` node, use `export default`',
              statement,
            );
          }
          if (
            ts.isIdentifier(statement.expression) &&
            statement.expression.escapedText === escapedName
          ) {
            exportName = 'default';
          }
        }
        if (ts.isExportDeclaration(statement)) {
          if (
            statement.exportClause &&
            ts.isNamedExports(statement.exportClause)
          ) {
            statement.exportClause.elements.forEach(element => {
              const localName = element.propertyName || element.name;
              const exportedName = element.name;
              if (localName.escapedText === escapedName) {
                exportName = exportedName.text;
              }
            });
          }
        }
      });
    }
    parser.modernScalars.set(id, {
      name,
      baseType: parser.withLoc(
        () =>
          getSchemaFromType(
            parser.checker.getTypeFromTypeNode(base[0].type),
            parser,
          ),
        base[0].type,
      ),
      loc,
      exportName,
    });

    return id;
  }
  // const name = brand.symbol && brand.symbol.name;
  // const declaration = brand.symbol && brand.symbol.valueDeclaration;
  // if (name && declaration) {
  //   const loc = parser.getLocation(declaration);
  //   return ScalarID.unsafeCast(name + ' at ' + resolve(loc.fileName));
  // }
}
