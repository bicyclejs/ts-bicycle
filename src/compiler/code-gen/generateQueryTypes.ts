import AST from '../AST';
import SchemaKind from 'bicycle/types/SchemaKind';
import generateType from './generateType';
import generateHeader from './generateHeader';
import extractProperties from './extractProperties';
import createImports from './createImports';

export default function generateQueryTypes(ast: AST): string {
  const {classes, scalars, enums} = ast;
  const result: string[] = [];
  result.push(generateHeader());
  const imports = createImports(result, {
    addField: {exportName: 'addField', filename: 'bicycle/typed-helpers/query'},
    BaseRootQuery: {
      exportName: 'BaseRootQuery',
      filename: 'bicycle/typed-helpers/query',
    },
    BaseQuery: {
      exportName: 'BaseQuery',
      filename: 'bicycle/typed-helpers/query',
    },
    Mutation: {exportName: 'Mutation', filename: 'bicycle/typed-helpers/query'},
    merge: {exportName: 'merge', filename: 'bicycle/typed-helpers/query'},
    ScalarTypes: {exportName: '*', filename: './scalar-types'},
    stringify: {
      exportName: 'stringify',
      filename: 'bicycle/typed-helpers/query',
    },

    // $RootCache, GetOptimisticValue
    Cache: {filename: 'bicycle/types/Cache'},
    RootCache: {exportName: 'RootCache', filename: './optimistic'},
    BaseCache: {exportName: 'BaseCache', filename: './optimistic'},
    GetOptimisticValue: {
      exportName: 'GetOptimisticValue',
      filename: './optimistic',
    },
    createNodeID: {
      exportName: 'createNodeID',
      filename: 'bicycle/types/NodeID',
    },
  });
  result.push(``);
  Object.keys(classes)
    .sort()
    .forEach(name => {
      const type = classes[name];
      const properties = extractProperties(type);
      result.push(
        `export class ${name}Query<TResult = {}> extends ${
          name === 'Root'
            ? imports.get('BaseRootQuery')
            : imports.get('BaseQuery')
        }<TResult> {`,
      );
      result.push(`  // fields`);
      properties.forEach(({propertyName, argsType, resultType}) => {
        const generics: string[] = [];
        const subQueries: {name: string; type: string}[] = [];
        const resultTypeString = generateType(resultType, name => {
          if (name in scalars || name in enums) {
            return imports.get('ScalarTypes') + '.' + name;
          }
          generics.push(`T${name}`);
          subQueries.push({name, type: `${name}Query<T${name}>`});
          return `T${name}`;
        });
        const args = [];
        if (argsType) {
          args.push(
            `args: ${generateType(
              argsType,
              name => imports.get('ScalarTypes') + '.' + name,
            )}`,
          );
        }
        let subQuery = 'true';
        if (subQueries.length === 1) {
          args.push(`${subQueries[0].name}: ${subQueries[0].type}`);
          subQuery = `(${subQueries[0].name} as any)._query`;
        }
        if (subQueries.length > 1) {
          args.push(
            `{${subQueries.map(s => s.name).join(', ')}}: {${subQueries
              .map(s => `${s.name}: ${s.type}`)
              .join(', ')}}`,
          );
          subQuery = `{${subQueries
            .map(s => `${s.name}: (${s.name} as any)._query`)
            .join(', ')}}`;
        }
        const genericsString = generics.length
          ? `<${generics.join(', ')}>`
          : '';
        const returnTypeString = `${name}Query<TResult & {${propertyName}: ${
          resultTypeString
        }}>`;
        result.push(
          `  ${args.length === 0 ? 'get ' : ''}${propertyName}${
            genericsString
          }(${args.join(', ')}): ${returnTypeString} {`,
        );

        const key = argsType
          ? `args === undefined ? ${JSON.stringify(
              propertyName,
            )} : ${JSON.stringify(propertyName + '(')} + ${imports.get(
              'stringify',
            )}(args) + ')'`
          : JSON.stringify(propertyName);
        result.push(
          `    return new ${name}Query(${imports.get(
            'addField',
          )}(this._query, ${key}, ${subQuery}));`,
        );
        result.push(`  }`);
      });
      result.push(``);
      result.push(
        `  merge<TOther>(other: ${name}Query<TOther>): ${
          name
        }Query<TResult & TOther> {`,
      );
      result.push(
        `    return new ${name}Query(${imports.get(
          'merge',
        )}(this._query, other._query));`,
      );
      result.push(`  }`);
      result.push(``);
      result.push(`  // mutations`);
      Object.keys(type.staticAPI.methods)
        .sort()
        .forEach(mutationName => {
          const t = type.staticAPI.methods[mutationName];
          const args =
            t.args.kind === SchemaKind.Void
              ? []
              : [
                  `args: ${generateType(
                    t.args,
                    name => imports.get('ScalarTypes') + '.' + name,
                  )}`,
                ];
          args.push(
            `optimisticUpdate?: (mutation: {objectName: '${
              name
            }'; methodName: '${mutationName}'; args: ${generateType(
              t.args,
              name => imports.get('ScalarTypes') + '.' + name,
            )}}, cache: ${imports.get(
              'RootCache',
            )}, getOptimisticValue: ${imports.get(
              'GetOptimisticValue',
            )}) => any`,
          );
          result.push(
            `  ${mutationName}(${args.join(', ')}): ${imports.get(
              'Mutation',
            )}<${generateType(
              t.result,
              name => imports.get('ScalarTypes') + '.' + name,
            )}> {`,
          );
          result.push(
            `    return new ${imports.get('Mutation')}(${JSON.stringify(
              name + '.' + mutationName,
            )}${
              args.length > 1 ? ', args' : ', undefined'
            }, optimisticUpdate as any);`,
          );
          result.push(`  }`);
        });
      result.push(`}`);
    });

  imports.finish();
  return result.join('\n');
}
