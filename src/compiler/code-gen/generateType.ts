import SchemaKind from 'bicycle/types/SchemaKind';
import ValueType from 'bicycle/types/ValueType';

export default function generateType(
  t: ValueType,
  onNamedType: (name: string) => string,
): string {
  switch (t.kind) {
    case SchemaKind.Boolean:
      return 'boolean';
    case SchemaKind.List:
      return generateType(t.element, onNamedType) + '[]';
    case SchemaKind.Literal:
      return JSON.stringify(t.value);
    case SchemaKind.Named:
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
          .map(name => {
            const type = t.properties[name];
            const isOptional = (t.properties[name] as any).isOptional;
            return (
              JSON.stringify(name) +
              (isOptional ? '?' : '') +
              ': ' +
              generateType(
                isOptional && type.kind === SchemaKind.Union
                  ? type.elements[0]
                  : type,
                onNamedType,
              )
            );
          })
          .join(', ') +
        '}'
      );
    case SchemaKind.Promise:
      return generateType(t.result, onNamedType);
    case SchemaKind.String:
      return 'string';
    case SchemaKind.Union:
      if ((t as any).enumDeclaration) {
        return onNamedType((t as any).enumDeclaration);
      }
      return (
        '(' +
        t.elements.map(t => generateType(t, onNamedType)).join(' | ') +
        ')'
      );
    case SchemaKind.Void:
      return 'void';
  }
}
