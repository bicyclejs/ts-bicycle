import * as ts from 'typescript';

export default function getSourceFile(parent: ts.Node): ts.SourceFile | null {
  while (parent.parent && parent !== parent.parent) {
    parent = parent.parent;
  }
  if (ts.isSourceFile(parent)) {
    return parent;
  } else {
    return null;
  }
}
