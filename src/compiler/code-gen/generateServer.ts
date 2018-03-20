import {resolve, relative, dirname} from 'path';
import shortenFileNames from '../utils/shortenFileNames';
import AST from '../AST';
import SchemaKind from 'bicycle/types/SchemaKind';
import ValueType from 'bicycle/types/ValueType';
import {ParsedMethod, ResolvedAPI} from '../ParsedObject';
import generateType from './generateType';
import {
  getScalarValidateFunctionImportStatement,
  getValidationFunctionName,
} from './generateScalars';
import generateHeader from './generateHeader';
import createImports, {Imports} from './createImports';

function printType(value: ValueType): string {
  if (value.kind === SchemaKind.Promise) {
    return printType(value.result);
  } else {
    return JSON.stringify(value);
  }
}

export default function generateServer(
  ast: AST,
  outputFileName: string,
  options: {shortenFileNames?: boolean} = {},
): string {
  const {classes, scalars, enums, context} = ast;
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
      if (name in scalars || name in enums) {
        return imports.get('ScalarTypes') + '.' + name;
      } else {
        return name;
      }
    });
  }
  Object.keys(classes)
    .sort()
    .forEach(className => {
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
  Object.keys(scalars)
    .sort()
    .forEach(scalarName => {
      result.push(
        getScalarValidateFunctionImportStatement(
          scalars[scalarName],
          outputDirName,
        ),
      );
    });

  const ctx = context.length
    ? context
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
        .join(' | ')
    : '{}';
  result.push(``);
  if ('Root' in classes) {
    result.push(
      `// root never has any actual data, so we create one reusable instance`,
    );
    result.push(`const root = new Root({});`);
  }

  result.push(`const schema: ${imports.get('Schema')}<${ctx}> = {`);
  Object.keys(classes)
    .sort()
    .forEach(className => {
      const cls = options.shortenFileNames
        ? shortenFileNames(classes[className])
        : classes[className];
      result.push(`  ${className}: {`);
      result.push(`    kind: ${imports.get('SchemaKind')}.NodeType,`);
      result.push(`    name: ${JSON.stringify(className)},`);
      result.push(`    description: undefined,`);
      if (className === 'Root') {
        result.push(`    id(): string {`);
        result.push(`      return "root";`);
      } else if (cls.idName in cls.instanceAPI.methods) {
        result.push(
          `    id(obj: ${className}, ctx: ${ctx}, qCtx: ${imports.get(
            'QueryContext',
          )}<${ctx}>): string {`,
        );
        result.push(
          `      return '' + obj.${cls.idName}(${['this', 'ctx', 'true', 'qCtx']
            .slice(0, cls.instanceAPI.methods[cls.idName].length)
            .join(', ')});`,
        );
      } else {
        result.push(
          `    id(obj: ${className}, ctx: ${ctx}, qCtx: ${imports.get(
            'QueryContext',
          )}<${ctx}>): string {`,
        );
        result.push(`      return '' + obj.data.${cls.idName};`);
      }
      result.push(`    },`);
      result.push(`    matches(obj: any): obj is ${className} {`);
      result.push(`      return obj instanceof ${className};`);
      result.push(`    },`);
      result.push(`    fields: {`);
      result.push(
        generateAPI({
          selfValue: className === 'Root' ? 'root' : 'value',
          parameters: (argType: string) => [
            `value: ${className === 'Root' ? '{}' : className}`,
            `args: ${argType}`,
            `context: ${ctx}`,
            `subQuery: true | ${imports.get('Query')}`,
            `qCtx: ${imports.get('QueryContext')}<${ctx}>`,
          ],
          args: ['args', 'context', 'subQuery', 'qCtx'],
          api: cls.instanceAPI,
          imports,
          kind: `${imports.get('SchemaKind')}.FieldMethod`,
          getType,
        }),
      );
      result.push(`    },`);
      result.push(`    mutations: {`);
      result.push(
        generateAPI({
          selfValue: className,
          parameters: (argType: string) => [
            `args: ${argType}`,
            `context: ${ctx}`,
            `mCtx: ${imports.get('MutationContext')}<${ctx}>`,
          ],
          args: ['args', 'context', 'mCtx'],
          api: cls.staticAPI,
          imports,
          kind: `${imports.get('SchemaKind')}.Mutation`,
          getType,
        }),
      );
      result.push(`    },`);
      result.push(`  },`);
    });
  Object.keys(scalars)
    .sort()
    .forEach(scalarName => {
      const scalar = options.shortenFileNames
        ? shortenFileNames(scalars[scalarName])
        : scalars[scalarName];
      result.push(`  ${scalarName}: {`);
      result.push(`    kind: ${imports.get('SchemaKind')}.Scalar,`);
      result.push(`    name: ${JSON.stringify(scalarName)},`);
      result.push(`    description: undefined,`);
      result.push(`    baseType: (${printType(scalar.type)} as any),`);
      result.push(`    validate: ${getValidationFunctionName(scalar)},`);
      result.push(`  },`);
    });
  result.push(`};`);
  result.push(`export {${imports.get('Options')}};`);
  result.push(
    `export default class Server extends ${imports.get(
      'BicycleServer',
    )}<${ctx}> {`,
  );
  result.push(`  constructor(options?: ${imports.get('Options')}) {`);
  result.push(`    super(schema, options);`);
  result.push(`  }`);
  result.push(`}`);
  imports.finish();
  return result.join('\n');
}

function makeCall(
  selfValue: string,
  method: ParsedMethod,
  args: string[],
): string {
  return `${selfValue}.${method.name}(${args
    .slice(0, method.length)
    .join(', ')})`;
}
interface APISpec {
  selfValue: string;
  parameters: (argType: string) => string[];
  args: string[];
  api: ResolvedAPI;
  imports: Imports<any>;
  kind: string;
  getType: (vt: ValueType) => string;
}
function generateAPI({
  selfValue,
  parameters,
  args,
  api,
  imports,
  kind,
  getType,
}: APISpec) {
  const result: string[] = [];
  function addAuth(arg: string, group: string) {
    result.push(
      `        auth(${parameters(arg).join(
        ', ',
      )}): boolean | PromiseLike<boolean> {`,
    );
    result.push(
      `          return ${makeCall(
        selfValue,
        api.authMethods['$' + group],
        args,
      )};`,
    );
    result.push(`        },`);
  }
  if (api.properties) {
    const properties = api.properties;
    Object.keys(properties)
      .sort()
      .forEach(propertyName => {
        if (propertyName in api.auth) {
          const auth = api.auth[propertyName];
          const valueType = properties[propertyName];
          result.push(`      ${propertyName}: {`);
          result.push(`        kind: ${kind},`);
          result.push(`        name: ${JSON.stringify(propertyName)},`);
          result.push(`        description: undefined,`);
          result.push(`        resultType: (${printType(valueType)} as any),`);
          result.push(
            `        argType: {kind: ${imports.get('SchemaKind')}.Void},`,
          );
          if (auth === 'public') {
            result.push(`        auth: 'public',`);
          } else {
            addAuth('void', auth);
          }
          result.push(
            `        resolve(${parameters('void').join(', ')}): ${getType(
              valueType,
            )} {`,
          );
          result.push(`          return ${selfValue}.data.${propertyName};`);
          result.push(`        },`);
          result.push(`      },`);
        }
      });
  }

  Object.keys(api.methods)
    .sort()
    .forEach(methodName => {
      const auth = api.auth[methodName];
      if (!auth) {
        return;
      }
      const method = api.methods[methodName];
      result.push(`      ${methodName}: {`);
      result.push(`        kind: ${kind},`);
      result.push(`        name: ${JSON.stringify(methodName)},`);
      result.push(`        description: undefined,`);
      result.push(`        resultType: (${printType(method.result)} as any),`);
      result.push(`        argType: (${printType(method.args)} as any),`);
      const argType = getType(method.args);
      if (auth === 'public') {
        result.push(`        auth: 'public',`);
      } else {
        addAuth(argType, auth);
      }
      const returnType = getType(method.result);
      result.push(
        `        resolve(${parameters(argType).join(
          ', ',
        )}): ${returnType} | PromiseLike<${returnType}> {`,
      );
      result.push(`          return ${makeCall(selfValue, method, args)};`);
      result.push(`        },`);
      result.push(`      },`);
    });
  return result.join('\n');
}
