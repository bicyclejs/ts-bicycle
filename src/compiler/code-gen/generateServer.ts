import {resolve, relative, dirname} from 'path';
import shortenFileNames from '../utils/shortenFileNames';
import AST from '../AST';
import SchemaKind from 'bicycle/types/SchemaKind';
import ValueType from 'bicycle/types/ValueType';
import ParsedObject from '../ParsedObject';
import generateType from './generateType';
import {
  getScalarValidateFunctionImportStatement,
  getValidationFunctionName,
} from './generateScalars';
import generateHeader from './generateHeader';
import createImports from './createImports';

export default function generateServer(
  ast: AST,
  outputFileName: string,
  options: {shortenFileNames?: boolean} = {},
): string {
  const {classes, scalars, context} = ast;
  outputFileName = resolve(outputFileName);
  const outputDirName = dirname(outputFileName);
  const result: string[] = [];
  result.push(generateHeader());
  const imports = createImports(result, {
    QueryContext: {filename: 'bicycle/types/QueryContext'},
    MutationContext: {filename: 'bicycle/types/MutationContext'},
    Schema: {filename: 'bicycle/types/Schema'},
    SchemaKind: {filename: 'bicycle/types/SchemaKind'},
    Query: {filename: 'bicycle/types/Query'},
    BicycleServer: {filename: 'bicycle/server-core'},
    Options: {exportName: 'Options', filename: 'bicycle/server-core'},
    ScalarTypes: {exportName: '*', filename: './scalar-types'},
  });
  function getType(t: ValueType): string {
    return generateType(t, name => {
      if (name in scalars) {
        return imports.get('ScalarTypes') + '.' + name;
      } else {
        return name;
      }
    });
  }
  Object.keys(classes).forEach(className => {
    const exportedName = classes[className].exportedName;
    const specifier =
      exportedName === 'default'
        ? className
        : exportedName === className
          ? `{${className}}`
          : `{${exportedName} as ${className}}`;
    const source =
      './' +
      relative(outputDirName, classes[className].loc.fileName).replace(
        /\.tsx?$/,
        '',
      );
    result.push(`import ${specifier} from '${source}';`);
  });
  Object.keys(scalars).forEach(scalarName => {
    result.push(getScalarValidateFunctionImportStatement(scalars[scalarName], outputDirName));
  });

  const ctx = context
    .map((ref, i) => {
      const source =
        './' + relative(outputDirName, ref.fileName).replace(/\.tsx?$/, '');
      if (ref.exportName === 'default') {
        result.push(`import _Context${i} from '${source}';`);
      } else {
        result.push(
          `import {${ref.exportName} as _Context${i}} from '${source}';`,
        );
      }
      return `_Context${i}`;
    })
    .join(' | ');
  result.push(``);

  result.push(`const schema: ${imports.get('Schema')}<${ctx}> = {`);
  Object.keys(classes).forEach(className => {
    const cls: ParsedObject = options.shortenFileNames
      ? shortenFileNames(classes[className])
      : classes[className];
    result.push(`  ${className}: {`);
    result.push(`    kind: ${imports.get('SchemaKind')}.NodeType,`);
    result.push(`    name: ${JSON.stringify(className)},`);
    result.push(`    description: undefined,`);
    result.push(
      `    id(obj: ${className}, ctx: ${ctx}, qCtx: ${imports.get('QueryContext')}<${ctx}>): string {`,
    );
    if (className === 'Root') {
      result.push(`      return "root";`);
    } else if (cls.idName in cls.methods) {
      result.push(
        `      return '' + obj.${cls.idName}(${['this', 'ctx', 'true', 'qCtx']
          .slice(0, cls.methods[cls.idName].length)
          .join(', ')});`,
      );
    } else {
      result.push(`      return '' + obj.data.${cls.idName};`);
    }
    result.push(`    },`);
    result.push(`    matches(obj: any): obj is ${className} {`);
    result.push(`      return obj instanceof ${className};`);
    result.push(`    },`);
    result.push(`    fields: {`);
    function addAuth(arg: string, group: string) {
      result.push(
        `        auth(value: ${className}, arg: ${arg}, context: ${ctx}, subQuery: true | ${imports.get('Query')}, qCtx: ${imports.get('QueryContext')}<${ctx}>): boolean | PromiseLike<boolean> {`,
      );
      result.push(
        `          return value.$${group}(${[
          'arg',
          'context',
          'subQuery',
          'qCtx',
        ]
          .slice(
            0,
            cls.methods['$' + group] ? cls.methods['$' + group].length : 0,
          )
          .join(', ')});`,
      );
      result.push(`        },`);
    }
    if (cls.data.kind === SchemaKind.Object) {
      const properties = cls.data.properties;
      Object.keys(properties).forEach(propertyName => {
        if (propertyName in cls.auth && !(propertyName in cls.methods)) {
          const auth = cls.auth[propertyName];
          const valueType = properties[propertyName];
          result.push(`      ${propertyName}: {`);
          result.push(`        kind: ${imports.get('SchemaKind')}.FieldMethod,`);
          result.push(`        name: ${JSON.stringify(propertyName)},`);
          result.push(`        description: undefined,`);
          result.push(
            `        resultType: (${JSON.stringify(valueType)} as any),`,
          );
          result.push(`        argType: {kind: ${imports.get('SchemaKind')}.Void},`);
          if (auth === 'public') {
            result.push(`        auth: 'public',`);
          } else {
            addAuth('void', auth);
          }
          result.push(
            `        resolve(value: ${className}): ${getType(valueType)} {`,
          );
          result.push(`          return value.data.${propertyName};`);
          result.push(`        },`);
          result.push(`      },`);
        }
      });
    }

    Object.keys(cls.methods).forEach(methodName => {
      if (methodName in cls.auth) {
        const auth = cls.auth[methodName];
        const method = cls.methods[methodName];
        result.push(`      ${methodName}: {`);
        result.push(`        kind: ${imports.get('SchemaKind')}.FieldMethod,`);
        result.push(`        name: ${JSON.stringify(methodName)},`);
        result.push(`        description: undefined,`);
        result.push(
          `        resultType: (${JSON.stringify(method.result)} as any),`,
        );
        result.push(
          `        argType: (${JSON.stringify(method.args)} as any),`,
        );
        if (auth === 'public') {
          result.push(`        auth: 'public',`);
        } else {
          addAuth(getType(method.args), auth);
        }
        const returnType = getType(method.result);
        result.push(
          `        resolve(value: ${className}, args: ${getType(
            method.args,
          )}, context: ${ctx}, subQuery: true | ${imports.get('Query')}, qCtx: ${imports.get('QueryContext')}<${ctx}>): ${returnType} | PromiseLike<${returnType}> {`,
        );
        result.push(
          `          return value.${methodName}(${[
            'args',
            'context',
            'subQuery',
            'qCtx',
          ]
            .slice(0, method.length)
            .join(', ')});`,
        );
        result.push(`        },`);
        result.push(`      },`);
      }
    });
    result.push(`    },`);
    result.push(`    mutations: {`);
    Object.keys(cls.staticMethods).forEach(methodName => {
      if (methodName in cls.staticAuth) {
        const auth = cls.staticAuth[methodName];
        const method = cls.staticMethods[methodName];
        result.push(`      ${methodName}: {`);
        result.push(`        kind: ${imports.get('SchemaKind')}.Mutation,`);
        result.push(`        name: ${JSON.stringify(methodName)},`);
        result.push(`        description: undefined,`);
        result.push(
          `        resultType: (${JSON.stringify(method.result)} as any),`,
        );
        result.push(
          `        argType: (${JSON.stringify(method.args)} as any),`,
        );
        if (auth === 'public') {
          result.push(`        auth: 'public',`);
        } else {
          result.push(
            `        auth(arg: ${getType(
              method.args,
            )}, context: ${ctx}, mCtx: ${imports.get('MutationContext')}<${ctx}>): boolean | PromiseLike<boolean> {`,
          );
          result.push(
            `          return ${className}.$${auth}(${['arg', 'context', 'mCtx']
              .slice(
                0,
                cls.staticMethods['$' + auth]
                  ? cls.staticMethods['$' + auth].length
                  : 0,
              )
              .join(', ')});`,
          );
          result.push(`        },`);
        }
        const returnType = getType(method.result);
        result.push(
          `        resolve(args: ${getType(
            method.args,
          )}, context: ${ctx}, mCtx: ${imports.get('MutationContext')}<${ctx}>): ${returnType} | PromiseLike<${returnType}> {`,
        );
        result.push(
          `          return ${className}.${methodName}(${[
            'args',
            'context',
            'mCtx',
          ]
            .slice(0, method.length)
            .join(', ')});`,
        );
        result.push(`        },`);
        result.push(`      },`);
      }
    });
    result.push(`    },`);
    result.push(`  },`);
  });
  Object.keys(scalars).forEach(scalarName => {
    const scalar = scalars[scalarName];
    result.push(`  ${scalarName}: {`);
    result.push(`    kind: ${imports.get('SchemaKind')}.Scalar,`);
    result.push(`    name: ${JSON.stringify(scalarName)},`);
    result.push(`    description: undefined,`);
    result.push(`    baseType: (${JSON.stringify(scalar.type)} as any),`);
    result.push(`    validate: ${getValidationFunctionName(scalar)},`);
    result.push(`  },`);
  });
  result.push(`};`);
  result.push(`export {${imports.get('Options')}};`);
  result.push(`export default class Server extends ${imports.get('BicycleServer')}<${ctx}> {`);
  result.push(`  constructor(options?: ${imports.get('Options')}) {`);
  result.push(`    super(schema, options);`);
  result.push(`  }`);
  result.push(`}`);
  imports.finish();
  return result.join('\n');
}
