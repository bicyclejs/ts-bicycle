import {lsrSync} from 'lsr';
import loadTsConfig from '../utils/loadTsConfig';
import parse from '../parser';
import AST from '../AST';
import {
  generateQuery,
  generateQueryTypes,
  generateOptimisticTypes,
  generateScalars,
  generateServer,
  generateClient,
} from './';

let ast: AST | null = null;
test('parse', () => {
  const filenames = lsrSync(__dirname + '/../../example')
    .filter(e => e.isFile())
    .map(e => e.fullPath);
  const config = loadTsConfig(process.cwd());
  ast = parse(filenames, config.options);
  expect(ast).toBeTruthy();
});

function testFn(fn: (ast: AST, filename: string) => string, filename: string) {
  test('compile ' + filename, () => {
    if (!ast) {
      return;
    }
    const outputFile = __dirname + '/../../example/' + filename + '.ts';
    const src = fn(ast, outputFile);
    expect(src).toMatchSnapshot();
  });
}

testFn((ast, outputFile) => generateQuery(ast), 'query');
testFn((ast, outputFile) => generateQueryTypes(ast), 'query-types');
testFn((ast, outputFile) => generateOptimisticTypes(ast), 'optimistic');
testFn((ast, outputFile) => generateScalars(ast, outputFile), 'scalar-types');
testFn(
  (ast, outputFile) =>
    generateServer(ast, outputFile, {shortenFileNames: true}),
  'server',
);
testFn((ast, outputFile) => generateClient(ast), 'client');
