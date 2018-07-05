import * as ts from 'typescript';
import ValueType, {LocationInfo} from 'bicycle/types/ValueType';
import {ScalarID, ScalarName, ModernScalarInfo} from './Scalars';

function isLocationInfo(node: any): node is LocationInfo {
  return typeof node.fileName === 'string' && typeof node.line === 'number';
}

export default class Parser {
  public readonly program: ts.Program;
  public readonly checker: ts.TypeChecker;
  public readonly scalarNames: Map<ScalarID, ScalarName> = new Map<
    ScalarID,
    ScalarName
  >();
  public readonly modernScalars: Map<ScalarID, ModernScalarInfo> = new Map<
    ScalarID,
    ModernScalarInfo
  >();
  public readonly usedScalarNames: Map<ScalarName, ScalarID> = new Map<
    ScalarName,
    ScalarID
  >();
  getScalarName(id: ScalarID, defaultName: string): ScalarName {
    const cached = this.scalarNames.get(id);
    if (cached) {
      return cached;
    }
    let i = 1;
    let name = ScalarName.unsafeCast(defaultName);
    while (this.usedScalarNames.has(name)) {
      i++;
      name = ScalarName.unsafeCast(defaultName + i);
    }
    this.scalarNames.set(id, name);
    this.usedScalarNames.set(name, id);
    return name;
  }
  renameScalar(id: ScalarID, name: string) {
    let newName = ScalarName.unsafeCast(name);
    const oldName = this.scalarNames.get(id);
    if (oldName === newName) {
      return newName;
    }
    this.scalarNames.delete(id);
    newName = this.getScalarName(id, name);
    return newName;
  }
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

  currentLocation: LocationInfo | undefined;
  withLoc(type: () => ValueType, node: ts.Node): ValueType {
    const locationInfo = this.getLocation(node);
    const oldLocation = this.currentLocation;
    this.currentLocation = locationInfo;
    try {
      const t = type();
      t.loc = locationInfo;
      this.currentLocation = oldLocation;
      return t;
    } catch (ex) {
      this.currentLocation = oldLocation;
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
