import * as ts from 'typescript';
import SchemaKind from 'bicycle/types/SchemaKind';
import ValueType from 'bicycle/types/ValueType';
import Parser from './Parser';
import {
  typeFlagsToString,
  isEnumType,
  isEnumLiteralType,
  isLiteralType,
  isBooleanLiteralType,
  isIntersectionType,
  isUnionType,
  isTypeReference,
  isObjectType,
} from './TypeUtils';
import {isObjectDataType} from './getObjectDataTypeNode';
import {scalarIDFromBrand, scalarIDFromSymbol} from './Scalars';

// TODO: track and prevent infinite recursion
export default function getSchemaFromType(
  type: ts.Type,
  parser: Parser,
): ValueType {
  const aliasSymbols = getAliasSymbols(type, parser);
  for (const aliasSymbol of aliasSymbols) {
    if (aliasSymbol.declarations) {
      const opaqueDeclarations = aliasSymbol.declarations.filter(d =>
        ts
          .getJSDocTags(d)
          .some(
            t => t.tagName.text === 'opaque' || t.tagName.text === 'nominal',
          ),
      );
      if (opaqueDeclarations.length === 1) {
        // getSymbolWalker
        const id = scalarIDFromSymbol(
          aliasSymbol,
          opaqueDeclarations[0],
          parser,
        );
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
  }

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
    const result: ValueType = {kind: SchemaKind.Literal, value: type.value};
    if (
      type.symbol &&
      (type.symbol.flags & ts.SymbolFlags.EnumMember) ===
        ts.SymbolFlags.EnumMember
    ) {
      const enumMemberName = type.symbol.name;
      const parent: ts.Symbol | undefined = (type.symbol as any).parent;
      if (parent) {
        (result as any).enumDeclaration = parent.name + '.' + enumMemberName;
        const declaration = parent.valueDeclaration;
        if (declaration && ts.isEnumDeclaration(declaration)) {
          parser.visitEnumDeclaration(declaration);
        }
      }
    }
    return result;
  }
  if (isBooleanLiteralType(type)) {
    return {kind: SchemaKind.Literal, value: type.intrinsicName === 'true'};
  }

  if (isEnumLiteralType(type)) {
    const result: ValueType = {
      kind: SchemaKind.Union,
      elements: type.types.map(t => getSchemaFromType(t, parser)),
    };
    if (type.aliasSymbol) {
      const declaration = type.aliasSymbol.valueDeclaration;
      if (declaration && ts.isEnumDeclaration(declaration)) {
        parser.visitEnumDeclaration(declaration);
      }
      (result as any).enumDeclaration = type.aliasSymbol.name;
    }
    return result;
  }
  if (isUnionType(type)) {
    return {
      kind: SchemaKind.Union,
      elements: type.types.map(t => getSchemaFromType(t, parser)),
    };
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
    const id = scalarIDFromBrand(type, parser);
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
        if (p.flags & ts.SymbolFlags.Optional) {
          properties[p.name] = parser.withLoc(
            () => ({
              kind: SchemaKind.Union,
              elements: [properties[p.name], {kind: SchemaKind.Void}],
            }),
            v,
          );
          // see code-gen/generateType for the nasty hack
          (properties[p.name] as any).isOptional = true;
        }
      }
    });
    // if (!properties.length && parser.currentLocation) {
    //   console.warn(
    //     parser.createError('Warning, empty object', parser.currentLocation)
    //       .message,
    //   );
    // }
    return {
      kind: SchemaKind.Object,
      properties,
    };
  }

  if (typeFlagsToString(type.flags) === 'Any, Narrowable, NotUnionOrUnit') {
    return {
      kind: SchemaKind.Any,
    };
  }

  throw new Error('Unkown type ' + typeFlagsToString(type.flags));
}

function getAliasSymbols(type: ts.Type, parser: Parser) {
  const symbol = type.getSymbol();
  if (symbol && symbol.declarations && symbol.declarations.length) {
    return (type.aliasSymbol ? [type.aliasSymbol] : []).concat(
      parser.checker
        .getSymbolsInScope(symbol.declarations[0], ts.SymbolFlags.TypeAlias)
        .filter(s => type === parser.checker.getDeclaredTypeOfSymbol(s)),
    );
  }
  return type.aliasSymbol ? [type.aliasSymbol] : [];
}
