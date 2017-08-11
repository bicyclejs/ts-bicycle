import {resolve} from 'path';
import {readFileSync, writeFileSync} from 'fs';
import {lsrSync} from 'lsr';
import {ParsedCommandLine} from 'typescript';
import {sync as mkdirp} from 'mkdirp';
import loadTsConfig from './compiler/utils/loadTsConfig';
import parse from './compiler/parser';
import {
  generateQuery,
  generateQueryTypes,
  generateOptimisticTypes,
  generateScalars,
  generateServer,
  generateClient,
} from './compiler/code-gen';

function writeIfChanged(filename: string, content: string) {
  try {
    if (readFileSync(filename, 'utf8') !== content) {
      writeFileSync(filename, content);
    }
  } catch (ex) {
    if (ex.code !== 'ENOENT') {
      throw ex;
    }
    writeFileSync(filename, content);
  }
}
export default function compile(
  inputDirname: string,
  outputDirname: string,
  options: {config?: ParsedCommandLine; shortenFileNames?: boolean} = {},
) {
  inputDirname = inputDirname.replace(/(\\|\/)$/, '');
  outputDirname = outputDirname.replace(/(\\|\/)$/, '');
  mkdirp(outputDirname);
  const filenames = lsrSync(inputDirname)
    .filter(e => e.isFile())
    .map(e => resolve(e.fullPath));

  const config = options.config || loadTsConfig(inputDirname);
  const ast = parse(filenames, config.options);
  writeIfChanged(
    outputDirname + '/scalar-types.ts',
    generateScalars(ast, outputDirname + '/scalar-types.ts'),
  );
  writeIfChanged(
    outputDirname + '/optimistic.ts',
    generateOptimisticTypes(ast),
  );
  writeIfChanged(outputDirname + '/query-types.ts', generateQueryTypes(ast));
  writeIfChanged(outputDirname + '/query.ts', generateQuery(ast));
  writeIfChanged(
    outputDirname + '/server.ts',
    generateServer(ast, outputDirname + '/server.ts', options),
  );
  writeIfChanged(outputDirname + '/client.ts', generateClient(ast));
}
