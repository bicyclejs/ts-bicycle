import SchemaKind from 'bicycle/types/SchemaKind';
import ValueType from 'bicycle/types/ValueType';

export default function generateType(
  t: ValueType,
  onNamedType?: (name: string) => string,
): string {
  switch (t.kind) {
    case SchemaKind.Boolean:
      return 'boolean';
    case SchemaKind.List:
      return generateType(t.element, onNamedType) + '[]';
    case SchemaKind.Literal:
      return JSON.stringify(t.value);
    case SchemaKind.Named:
      if (!onNamedType) {
        throw new Error(
          'Cannot use named type as an argument or the result of a mutation',
        );
      }
      return onNamedType(t.name);
    case SchemaKind.Null:
      return 'null';
    case SchemaKind.Any:
      return 'any';
    case SchemaKind.Number:
      return 'number';
    case SchemaKind.Object:
      return (
        '{' +
        Object.keys(t.properties)
          .map(
            name =>
              JSON.stringify(name) +
              ': ' +
              generateType(t.properties[name], onNamedType),
          )
          .join(', ') +
        '}'
      );
    case SchemaKind.Promise:
      return generateType(t.result, onNamedType);
    case SchemaKind.String:
      return 'string';
    case SchemaKind.Union:
      return (
        '(' +
        t.elements.map(t => generateType(t, onNamedType)).join(' | ') +
        ')'
      );
    case SchemaKind.Void:
      return 'void';
  }
}
