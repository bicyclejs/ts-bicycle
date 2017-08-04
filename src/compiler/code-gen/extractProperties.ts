import SchemaKind from 'bicycle/types/SchemaKind';
import ValueType from 'bicycle/types/ValueType';
import ParsedObject from '../ParsedObject';

export interface Property {
  propertyName: string;
  argsType?: ValueType;
  resultType: ValueType;
}

export default function extractProperties(type: ParsedObject): Property[] {
  const result: Property[] = [];
  if (type.data.kind === SchemaKind.Object) {
    const properties = type.data.properties;
    Object.keys(properties).forEach(propertyName => {
      if (propertyName in type.methods || !(propertyName in type.auth)) {
        return;
      }
      result.push({propertyName, resultType: properties[propertyName]});
    });
  }
  Object.keys(type.methods).forEach(methodName => {
    if (!(methodName in type.auth)) {
      return;
    }
    const args = type.methods[methodName].args;
    result.push({
      propertyName: methodName,
      argsType: args.kind === SchemaKind.Void ? undefined : args,
      resultType: type.methods[methodName].result,
    });
  });
  return result;
}
