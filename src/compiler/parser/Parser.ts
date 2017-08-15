import * as ts from 'typescript';
import ValueType, {LocationInfo} from 'bicycle/types/ValueType';
import {ScalarID, ScalarName} from './Scalars';

function isLocationInfo(node: any): node is LocationInfo {
  return typeof node.fileName === 'string' && typeof node.line === 'number';
}

export default class Parser {
  public readonly program: ts.Program;
  public readonly checker: ts.TypeChecker;
  public readonly scalarNames = new Map<ScalarID, ScalarName>();
  public readonly fileNames = new Map<string, string>();
  constructor(fileNames: string[], options: ts.CompilerOptions) {
    fileNames.forEach(name => {
      this.fileNames.set(name.toLowerCase(), name);
    });
    // Build a program using the set of root file names in fileNames
    this.program = ts.createProgram(fileNames, options);

    // Get the checker, we will use it to find more about classes
    this.checker = this.program.getTypeChecker();
  }
  getLocation(node: ts.Node): LocationInfo {
    const source = node.getSourceFile();
    const {line, character} = source.getLineAndCharacterOfPosition(node.pos);
    const lines = source.text.split('\n');
    const fileName =
      this.fileNames.get(source.fileName.toLowerCase()) || source.fileName;
    if (character >= lines[line].length) {
      return {fileName, line: line + 2};
    } else {
      return {fileName, line: line + 1};
    }
  }
  withLoc(type: () => ValueType, node: ts.Node): ValueType {
    const locationInfo = this.getLocation(node);
    try {
      const t = type();
      t.loc = locationInfo;
      return t;
    } catch (ex) {
      if (!ex.tsLocation) {
        ex.message +=
          ' ' + locationInfo.fileName + ' line ' + locationInfo.line;
        ex.tsLocation = locationInfo;
      } else {
        if (/^Stack\:$/m.test(ex.message)) {
          ex.message += '\n\nStack:\n\n';
        } else {
          ex.message = ex.message.trim();
        }
        ex.message +=
          '\n  ' +
          locationInfo.fileName +
          ' line ' +
          locationInfo.line +
          '\n\n';
      }
      throw ex;
    }
  }
  createError(msg: string, node: ts.Node | LocationInfo): Error {
    if (!isLocationInfo(node)) {
      node = this.getLocation(node);
    }
    const str = msg + ' ' + node.fileName + ':' + node.line;
    return new Error(str);
  }
}
