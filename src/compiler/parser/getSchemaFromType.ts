import * as ts from 'typescript';
import SchemaKind from 'bicycle/types/SchemaKind';
import ValueType from 'bicycle/types/ValueType';
import Parser from './Parser';
import {
  typeFlagsToString,
  isEnumType,
  isLiteralType,
  isIntersectionType,
  isUnionType,
  isTypeReference,
  isObjectType,
} from './TypeUtils';
import {isObjectDataType} from './getObjectDataTypeNode';
import {scalarIDFromBrand} from './Scalars';

// TODO: track and prevent infinite recursion
export default function getSchemaFromType(
  type: ts.Type,
  parser: Parser,
): ValueType {
  if (type.flags & ts.TypeFlags.Boolean) {
    return {kind: SchemaKind.Boolean};
  }
  if (type.flags & ts.TypeFlags.Number) {
    return {kind: SchemaKind.Number};
  }
  if (type.flags & ts.TypeFlags.String) {
    return {kind: SchemaKind.String};
  }
  if (type.flags & ts.TypeFlags.Null) {
    return {kind: SchemaKind.Null};
  }
  if (type.flags & ts.TypeFlags.Void) {
    return {kind: SchemaKind.Void};
  }

  if (isLiteralType(type)) {
    return {kind: SchemaKind.Literal, value: type.value};
  }

  if (isIntersectionType(type) && type.types.length === 2) {
    const [a, b] = type.types;
    const brand = isEnumType(a) ? a : isEnumType(b) ? b : undefined;
    if (brand) {
      const id = scalarIDFromBrand(brand, parser);
      if (id) {
        const name = parser.scalarNames.get(id);
        if (name) {
          return {
            kind: SchemaKind.Named,
            name,
          };
        }
      }
    }
  }

  if (isEnumType(type)) {
    // TODO
  }

  if (isUnionType(type)) {
    return {
      kind: SchemaKind.Union,
      elements: type.types.map(t => getSchemaFromType(t, parser)),
    };
  }

  if (
    isTypeReference(type) &&
    type.symbol &&
    type.symbol.name === 'Array' &&
    type.typeArguments
  ) {
    return {
      kind: SchemaKind.List,
      element: getSchemaFromType(type.typeArguments[0], parser),
    };
  }
  if (
    isTypeReference(type) &&
    type.symbol &&
    type.symbol.name === 'Promise' &&
    type.typeArguments
  ) {
    return {
      kind: SchemaKind.Promise,
      result: getSchemaFromType(type.typeArguments[0], parser),
    };
  }
  if (isTypeReference(type) && type.symbol && isObjectDataType(type.target)) {
    const declaration = type.symbol.declarations && type.symbol.declarations[0];
    if (declaration) {
      const name = (declaration as ts.NamedDeclaration).name;
      if (name && ts.isIdentifier(name)) {
        return {kind: SchemaKind.Named, name: name.text};
      }
    }
    return {kind: SchemaKind.Named, name: type.symbol.getName()};
  }
  if (isObjectType(type)) {
    const properties: {[key: string]: ValueType} = {};
    type.getProperties().forEach(p => {
      if (
        p.valueDeclaration &&
        ts.isPropertySignature(p.valueDeclaration) &&
        p.valueDeclaration.type
      ) {
        const v = p.valueDeclaration;
        const t = p.valueDeclaration.type;
        properties[p.name] = parser.withLoc(
          () =>
            getSchemaFromType(parser.checker.getTypeFromTypeNode(t), parser),
          v,
        );
      }
    });
    return {
      kind: SchemaKind.Object,
      properties,
    };
  }

  throw new Error('Unkown type ' + typeFlagsToString(type.flags));
}
