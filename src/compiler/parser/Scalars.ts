import {resolve} from 'path';
import * as ts from 'typescript';
import ValueType, {LocationInfo} from 'bicycle/types/ValueType';
import Parser from './Parser';
import {ScalarID, ScalarName} from './ScalarTypes';

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
