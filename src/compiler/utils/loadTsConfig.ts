import {dirname} from 'path';
import * as ts from 'typescript';
import normalizeSlashes from './normalizeSlashes';

const {loadSync} = require('tsconfig');

export default function loadTsConfig(cwd: string): ts.ParsedCommandLine {
  const result = loadSync(cwd);
  const configPath = result.path && normalizeSlashes(result.path);
  const basePath = configPath ? dirname(configPath) : normalizeSlashes(cwd);
  return ts.parseJsonConfigFileContent(
    result.config,
    ts.sys,
    basePath,
    undefined,
    configPath,
  );
}
