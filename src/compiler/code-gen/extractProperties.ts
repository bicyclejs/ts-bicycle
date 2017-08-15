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
  if (type.instanceAPI.properties) {
    const properties = type.instanceAPI.properties;
    Object.keys(properties).forEach(propertyName => {
      if (propertyName in type.instanceAPI.auth) {
        result.push({propertyName, resultType: properties[propertyName]});
      }
    });
  }
  Object.keys(type.instanceAPI.methods).forEach(methodName => {
    if (methodName in type.instanceAPI.auth) {
      const args = type.instanceAPI.methods[methodName].args;
      result.push({
        propertyName: methodName,
        argsType: args.kind === SchemaKind.Void ? undefined : args,
        resultType: type.instanceAPI.methods[methodName].result,
      });
    }
  });
  return result;
}
