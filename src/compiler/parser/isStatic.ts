import ts from 'typescript';

export default function isStatic(e: ts.ClassElement): boolean {
  return !!(
    e.modifiers &&
    e.modifiers.some(token => token.kind === ts.SyntaxKind.StaticKeyword)
  );
}
