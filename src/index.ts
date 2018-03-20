import {resolve} from 'path';
import * as fs from 'fs';
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
import formatResult from './formatResult';

function readFile(filename: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, 'utf8', (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}
function writeFile(filename: string, content: string) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, content, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}
async function writeIfChanged(filename: string, content: string) {
  const formatted = await formatResult(content, filename);
  try {
    if ((await readFile(filename)) !== formatted) {
      await writeFile(filename, formatted);
    }
  } catch (ex) {
    if (ex.code !== 'ENOENT') {
      throw ex;
    }
    await writeFile(filename, formatted);
  }
}
export default async function compile(
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
  await Promise.all([
    writeIfChanged(
      outputDirname + '/scalar-types.ts',
      generateScalars(ast, outputDirname + '/scalar-types.ts'),
    ),
    writeIfChanged(
      outputDirname + '/optimistic.ts',
      generateOptimisticTypes(ast),
    ),
    writeIfChanged(outputDirname + '/query-types.ts', generateQueryTypes(ast)),
    writeIfChanged(outputDirname + '/query.ts', generateQuery(ast)),
    writeIfChanged(
      outputDirname + '/server.ts',
      generateServer(ast, outputDirname + '/server.ts', options),
    ),
    writeIfChanged(outputDirname + '/client.ts', generateClient(ast)),
  ]);
  return ast.programFiles;
}
