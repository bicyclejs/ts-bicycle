import SchemaKind from 'bicycle/types/SchemaKind';
import ValueType from 'bicycle/types/ValueType';

export class State {
  // Map of source code to name
  private declaredFunctions: Map<string, string> = new Map();
  private nextIndex: number = 1;
  private prefix: string[] = [];
  declareFunction(str: string): string {
    const existingName = this.declaredFunctions.get(str);
    if (existingName) {
      return existingName;
    }
    const newName = '_helper' + this.nextIndex++;
    this.declaredFunctions.set(str, newName);
    this.prefix.push(`const ${newName} = ${str};`);
    return newName;
  }
  toString(): string {
    return this.prefix.join('\n');
  }
}

export default function typeAssertion(
  name: string,
  value: ValueType,
  state: State,
): string {
  switch (value.kind) {
    case SchemaKind.Boolean:
      return `typeof ${name} === 'boolean'`;
    case SchemaKind.Literal:
      return `${name} === ${JSON.stringify(value.value)}`;
    case SchemaKind.Null:
      return `${name} === null`;
    case SchemaKind.Void:
      return `${name} === undefined`;
    case SchemaKind.Any:
      return `true`;
    case SchemaKind.Number:
      return `typeof ${name} === 'number'`;
    case SchemaKind.String:
      return `typeof ${name} === 'string'`;
    case SchemaKind.List:
      return `${name}.every(${typeAssertionFn(value.element, state)})`;
    case SchemaKind.Object:
      return (
        '(' +
        Object.keys(value.properties)
          .map(propertyName =>
            typeAssertion(
              `${name}.${propertyName}`,
              value.properties[propertyName],
              state,
            ),
          )
          .join(' && ') +
        ')'
      );
    case SchemaKind.Union:
      return (
        '(' +
        value.elements
          .map(element => typeAssertion(name, element, state))
          .join(' || ') +
        ')'
      );
    case SchemaKind.Promise:
    case SchemaKind.Named:
      return 'false';
  }
}

function typeAssertionFn(value: ValueType, state: State): string {
  return state.declareFunction('v => ' + typeAssertion('v', value, state));
}
