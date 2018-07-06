import ts from 'typescript';
import {ResolvedAPI, ParsedMethod} from '../ParsedObject';
import {LocationInfo} from 'bicycle/types/ValueType';
import Parser from './Parser';
import classHasMethod from './classHasMethod';
import parseMethodDeclaration from './parseMethodDeclaration';

export default function resolveObjectAPI(
  members: ts.ClassElement[],
  idName: {name: string; loc: LocationInfo} | undefined,
  parser: Parser,
): ResolvedAPI {
  const authMethodNames = new Set<string>();
  const exposedMethods = new Set<string>();
  const auth: {[propertyName: string]: string} = {};
  const authMethods: {[key: string]: ParsedMethod} = {};
  const methods: {[key: string]: ParsedMethod} = {};
  members.forEach(member => {
    if (ts.isPropertyDeclaration(member) && ts.isIdentifier(member.name)) {
      if (member.name.text === '$auth') {
        if (
          !member.initializer ||
          !ts.isObjectLiteralExpression(member.initializer)
        ) {
          throw parser.createError(
            'The $auth must be initialised with an object literal.',
            member.initializer || member,
          );
        }
        member.initializer.properties.forEach(property => {
          if (!ts.isPropertyAssignment(property)) {
            throw parser.createError(
              'Property in $auth must be a plain property with array as the value.',
              property,
            );
          }
          if (!property.name || !ts.isIdentifier(property.name)) {
            throw parser.createError(
              'Property name in $auth must be an identifier.',
              property.name || property,
            );
          }
          const groupName = property.name.text;
          authMethodNames.add('$' + groupName);
          if (
            groupName !== 'public' &&
            !classHasMethod(members, '$' + groupName)
          ) {
            throw parser.createError(
              `Could not find an implementation for $${groupName}`,
              property.name,
            );
          }
          if (!ts.isArrayLiteralExpression(property.initializer)) {
            throw parser.createError(
              'Property value in $auth must be an array literal.',
              property.initializer,
            );
          }
          property.initializer.elements.forEach(element => {
            if (!ts.isStringLiteral(element)) {
              throw parser.createError(
                'Property value in $auth must be an array of string literals.',
                element,
              );
            }
            const propertyName = element.text;
            if (auth[propertyName]) {
              throw parser.createError(
                `"${propertyName} is in $auth categories of "${
                  auth[propertyName]
                }" and ` +
                  `"${groupName}". We can't tell whether you expected us to require users ` +
                  `to match "${auth[propertyName]} && ${groupName}" or ` +
                  `"${
                    auth[propertyName]
                  } || ${groupName}". You need to be explicit. ` +
                  `You could set up a new group like: \n\n` +
                  `async $${auth[propertyName]}And${groupName[0].toUpperCase() +
                    groupName.substr(1)}(args: any, ctx: Context) {\n` +
                  `  return (await this.$${
                    auth[propertyName]
                  }(args, ctx)) && (await this.$${groupName}(args, ctx));\n` +
                  `}`,
                element,
              );
            }
            auth[propertyName] = groupName;
            exposedMethods.add(propertyName);
            return propertyName;
          });
        });
      }
    }
  });
  members.forEach(member => {
    if (ts.isMethodDeclaration(member) && ts.isIdentifier(member.name)) {
      const name = member.name.text;
      if (authMethodNames.has(name)) {
        authMethods[name] = parseMethodDeclaration(member, parser);
      }
      if (exposedMethods.has(name) || (idName && idName.name === name)) {
        methods[name] = parseMethodDeclaration(member, parser);
      }
    }
  });
  return {auth, authMethods, methods};
}
