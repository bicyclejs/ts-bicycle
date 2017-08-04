import {resolve} from 'path';
import * as ts from 'typescript';
import ValueType, {LocationInfo} from 'bicycle/types/ValueType';
import Parser from './Parser';

export const enum ScalarIDBrand {}
export type ScalarID = string & ScalarIDBrand;
export const enum ScalarNameBrand {}
export type ScalarName = string & ScalarNameBrand;
export interface ScalarInfo {
  brandName: string;
  baseType: ValueType;
  loc: LocationInfo,
  node: ts.Node;
}
export function scalarID(info: ScalarInfo): ScalarID {
  return (info.brandName + ' at ' + resolve(info.loc.fileName) as ScalarID);
}
export function scalarIDFromBrand(brand: ts.EnumType, parser: Parser): ScalarID | void {
  const name = brand.symbol && brand.symbol.name;
  const declaration = brand.symbol && brand.symbol.valueDeclaration;
  if (name && declaration) {
    const loc = parser.getLocation(declaration);
    return (name + ' at ' + resolve(loc.fileName) as ScalarID);
  }
}