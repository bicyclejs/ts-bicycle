import * as ts from 'typescript';
import {LocationInfo} from 'bicycle/types/ValueType';
import Parser from './Parser';

export default function getBicycleObjectIdProperty(
  node: ts.ClassDeclaration,
  parser: Parser,
): {name: string; loc: LocationInfo} {
  const result = {name: 'id', loc: parser.getLocation(node.name || node)};
  node.members.forEach(member => {
    if (ts.isPropertyDeclaration(member) && ts.isIdentifier(member.name)) {
      if (member.name.text === '$id') {
        if (!member.initializer || !ts.isStringLiteral(member.initializer)) {
          throw parser.createError(
            'The $id must be initialised with a string literal.',
            member.initializer || member,
          );
        }
        result.name = member.initializer.text;
        result.loc = parser.getLocation(member.initializer || member);
      }
    }
  });
  return result;
}
