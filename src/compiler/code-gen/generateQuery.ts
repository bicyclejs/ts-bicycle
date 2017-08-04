import AST from '../AST';
import generateHeader from './generateHeader';
import createImports from './createImports';

export default function generateQuery(ast: AST): string {
  const {classes} = ast;
  const result: string[] = [];
  result.push(generateHeader());
  const imports = createImports(result, {
    getType: {exportName: 'getType', filename: 'bicycle/typed-helpers/query'},
    QueryTypes: {exportName: '*', filename: './query-types'},
  });
  result.push(``);
  result.push(`export {${imports.get('getType')}};`);
  result.push(``);
  Object.keys(classes).forEach(name => {
    result.push(
      `export const ${name} = new ${imports.get(
        'QueryTypes',
      )}.${name}Query<{}>({});`,
    );
  });
  result.push(``);

  imports.finish();
  return result.join('\n');
}
