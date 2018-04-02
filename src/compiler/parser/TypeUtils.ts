import * as ts from 'typescript';

export interface BooleanLiteralType extends ts.Type {
  intrinsicName: 'true' | 'false';
}

export function isIntersectionType(type: ts.Type): type is ts.IntersectionType {
  return !!(type.flags & ts.TypeFlags.Intersection);
}
export function isUnionType(type: ts.Type): type is ts.UnionType {
  return !!(type.flags & ts.TypeFlags.Union);
}
export function isLiteralType(
  type: ts.Type,
): type is ts.StringLiteralType | ts.NumberLiteralType {
  return !isBooleanLiteralType(type) && !!(type.flags & ts.TypeFlags.Literal);
}
export function isBooleanLiteralType(
  type: ts.Type,
): type is BooleanLiteralType {
  return !!(type.flags & ts.TypeFlags.BooleanLiteral);
}
export function isEnumType(type: ts.Type): type is ts.EnumType {
  return !!(type.flags & ts.TypeFlags.Enum);
}
export function isEnumLiteralType(type: ts.Type): type is ts.UnionType {
  return !!(type.flags & ts.TypeFlags.EnumLiteral);
}
export function isObjectType(type: ts.Type): type is ts.ObjectType {
  return !!(type.flags & ts.TypeFlags.Object);
}
export function isInterfaceType(type: ts.Type): type is ts.InterfaceType {
  return isObjectType(type) && !!(type.objectFlags & ts.ObjectFlags.Interface);
}
export function isTypeReference(type: ts.Type): type is ts.TypeReference {
  return isObjectType(type) && !!(type.objectFlags & ts.ObjectFlags.Reference);
}
const flagMapping: Array<[ts.TypeFlags, string]> = [
  [ts.TypeFlags.Any, 'Any'],
  [ts.TypeFlags.String, 'String'],
  [ts.TypeFlags.Number, 'Number'],
  [ts.TypeFlags.Boolean, 'Boolean'],
  [ts.TypeFlags.Enum, 'Enum'],
  [ts.TypeFlags.StringLiteral, 'StringLiteral'],
  [ts.TypeFlags.NumberLiteral, 'NumberLiteral'],
  [ts.TypeFlags.BooleanLiteral, 'BooleanLiteral'],
  [ts.TypeFlags.EnumLiteral, 'EnumLiteral'],
  [ts.TypeFlags.ESSymbol, 'ESSymbol'],
  [ts.TypeFlags.Void, 'Void'],
  [ts.TypeFlags.Undefined, 'Undefined'],
  [ts.TypeFlags.Null, 'Null'],
  [ts.TypeFlags.Never, 'Never'],
  [ts.TypeFlags.TypeParameter, 'TypeParameter'],
  [ts.TypeFlags.Object, 'Object'],
  [ts.TypeFlags.Union, 'Union'],
  [ts.TypeFlags.Intersection, 'Intersection'],
  [ts.TypeFlags.Index, 'Index'],
  [ts.TypeFlags.IndexedAccess, 'IndexedAccess'],
  [ts.TypeFlags.NonPrimitive, 'NonPrimitive'],
  [ts.TypeFlags.Literal, 'Literal'],
  [ts.TypeFlags.StringOrNumberLiteral, 'StringOrNumberLiteral'],
  [ts.TypeFlags.PossiblyFalsy, 'PossiblyFalsy'],
  [ts.TypeFlags.StringLike, 'StringLike'],
  [ts.TypeFlags.NumberLike, 'NumberLike'],
  [ts.TypeFlags.BooleanLike, 'BooleanLike'],
  [ts.TypeFlags.EnumLike, 'EnumLike'],
  [ts.TypeFlags.UnionOrIntersection, 'UnionOrIntersection'],
  [ts.TypeFlags.StructuredType, 'StructuredType'],
  [ts.TypeFlags.TypeVariable, 'TypeVariable'],
  [ts.TypeFlags.Narrowable, 'Narrowable'],
  [ts.TypeFlags.NotUnionOrUnit, 'NotUnionOrUnit'],
];

export function typeFlagsToString(flags: ts.TypeFlags): string {
  return flagMapping
    .filter(f => f[0] & flags)
    .map(f => f[1])
    .join(', ');
}
