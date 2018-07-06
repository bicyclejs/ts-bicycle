import ts from 'typescript';

export default function classHasMethod(
  elements: ts.ClassElement[],
  name: string,
) {
  return elements.some(member => {
    return (
      ts.isMethodDeclaration(member) &&
      ts.isIdentifier(member.name) &&
      member.name.text === name
    );
  });
}
