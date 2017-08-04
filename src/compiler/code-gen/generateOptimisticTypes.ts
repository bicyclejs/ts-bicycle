import AST from '../AST';
import SchemaKind from 'bicycle/types/SchemaKind';
import generateType from './generateType';
import generateHeader from './generateHeader';
import extractProperties from './extractProperties';
import createImports from './createImports';

export default function generateOptimisticTypes(ast: AST): string {
  const {classes, scalars} = ast;
  const result: string[] = [];
  result.push(generateHeader());

  const imports = createImports(result, {
    ScalarTypes: {exportName: '*', filename: './scalar-types'},
    BaseCache: {exportName: 'BaseCache', filename: 'bicycle/typed-helpers/optimistic'},
    GetOptimisticValue: {exportName: 'GetOptimisticValue', filename: 'bicycle/typed-helpers/optimistic'},
  });
  result.push(``);
  result.push(`export {${imports.get('GetOptimisticValue')}};`);
  result.push(``);
  Object.keys(classes).forEach(name => {
    const type = classes[name];
    const properties = extractProperties(type);
    result.push(`export interface ${name}OptimisticUpdaters {`);
    Object.keys(type.staticMethods).forEach(mutationName => {
      if (!(mutationName in type.staticAuth)) {
        return;
      }
      const t = type.staticMethods[mutationName];
      result.push(
        `  ${mutationName}?: (mutation: {objectName: '${name}'; methodName: '${mutationName}'; args: ${generateType(
          t.args,
          name => imports.get('ScalarTypes') + '.' + name,
        )}}, cache: RootCache, getOptimisticValue: ${imports.get('GetOptimisticValue')}) => any`,
      );
    });
    result.push(`}`);
    result.push(`export interface ${name}Cache {`);
    properties.forEach(({propertyName, argsType, resultType}) => {
      const args = ['name: ' + JSON.stringify(propertyName)];
      if (argsType && argsType.kind !== SchemaKind.Void) {
        args.push(
          `args: ${generateType(
            argsType,
            name => imports.get('ScalarTypes') + '.' + name,
          )}`,
        );
      }
      result.push(
        `  get(${args.join(', ')}): void | ${generateType(resultType, name => {
          if (name in scalars) {
            return imports.get('ScalarTypes') + '.' + name;
          } else {
            return name + 'Cache';
          }
        })};`,
      );
    });
    properties.forEach(({propertyName, argsType, resultType}) => {
      const args = ['name: ' + JSON.stringify(propertyName)];
      if (argsType && argsType.kind !== SchemaKind.Void) {
        args.push(
          `args: ${generateType(
            argsType,
            name => imports.get('ScalarTypes') + '.' + name,
          )}`,
        );
      }
      args.push(
        `value: ${generateType(resultType, name => {
          if (name in scalars) {
            return imports.get('ScalarTypes') + '.' + name;
          } else {
            return name + 'Cache';
          }
        })}`,
      );
      result.push(`  set(${args.join(', ')}): this;`);
    });
    if (name === 'Root') {
      Object.keys(classes).forEach(typeName => {
        if (typeName === 'Root') {
          return;
        }
        result.push(
          `  getObject(typeName: '${typeName}', id: string): ${typeName}Cache;`,
        );
      });
    }
    result.push(`}`);
  });
  result.push(`export default interface OptimisticUpdaters {`);
  Object.keys(classes).forEach(name => {
    result.push(`  ${name}?: ${name}OptimisticUpdaters;`);
  });
  result.push(`}`);
  imports.finish();
  return result.join('\n');
}
