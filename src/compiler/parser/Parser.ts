import * as ts from 'typescript';
import ValueType, {LocationInfo} from 'bicycle/types/ValueType';
import {ScalarID, ScalarName} from './Scalars';

export default class Parser {
  public readonly program: ts.Program;
  public readonly checker: ts.TypeChecker;
  public readonly scalarNames = new Map<ScalarID, ScalarName>();
  constructor(fileNames: string[], options: ts.CompilerOptions) {
    // Build a program using the set of root file names in fileNames
    this.program = ts.createProgram(fileNames, options);

    // Get the checker, we will use it to find more about classes
    this.checker = this.program.getTypeChecker();
  }
  getLocation(node: ts.Node): LocationInfo {
    const source = node.getSourceFile();
    const {line, character} = source.getLineAndCharacterOfPosition(node.pos);
    const lines = source.text.split('\n');
    if (character >= lines[line].length) {
      return {fileName: source.fileName, line: line + 2};
    } else {
      return {fileName: source.fileName, line: line + 1};
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
      }
      throw ex;
    }
  }
}
