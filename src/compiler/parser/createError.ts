import * as ts from 'typescript';

export default function createError(msg: string, node: ts.Node): Error {
  const source = node.getSourceFile();
  const {line, character} = source.getLineAndCharacterOfPosition(node.pos);
  const str = msg + ' ' + source.fileName + ':' + (line + 1) + ',' + character;
  return new Error(str);
}
