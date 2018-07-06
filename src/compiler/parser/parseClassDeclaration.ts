import ts from 'typescript';
import getObjectDataTypeNode from './getObjectDataTypeNode';
import getSchemaFromType from './getSchemaFromType';
import isStatic from './isStatic';
import SchemaKind from 'bicycle/types/SchemaKind';
import {isObjectType} from './TypeUtils';
import getBicycleObjectIdProperty from './getBicycleObjectIdProperty';
import getExportName from './getExportName';
import resolveObjectAPI from './resolveObjectAPI';
import Parser from './Parser';

export default function parseClassDeclaration(
  node: ts.ClassDeclaration,
  parser: Parser,
) {
  const dataTypeNode = getObjectDataTypeNode(node, parser);
  if (!dataTypeNode) {
    // does not extend `Object`, ignoring
    return;
  }

  if (!node.name) {
    throw parser.createError(
      `You cannot use an anonymous class as an object type in a bicycle schema.`,
      node,
    );
  }
  const className = node.name.text;
  if (className in parser.result.classes) {
    throw parser.createError(
      `Duplicate declaration for class ${className}`,
      node.name,
    );
  }
  if (
    !node.modifiers ||
    !node.modifiers.some(m => m.kind === ts.SyntaxKind.ExportKeyword)
  ) {
    throw parser.createError(
      `${className} is not exported, you must export any Bicycle Schema Objects`,
      node.name,
    );
  }

  const idName = getBicycleObjectIdProperty(node, parser);
  const instanceAPI = resolveObjectAPI(
    node.members.filter(e => !isStatic(e)),
    idName,
    parser,
  );
  const staticAPI = resolveObjectAPI(
    node.members.filter(e => isStatic(e)),
    undefined,
    parser,
  );

  const dataType = parser.checker.getTypeFromTypeNode(dataTypeNode);
  const properties = (instanceAPI.properties = {});
  if (isObjectType(dataType)) {
    dataType.getProperties().forEach(p => {
      if (
        (p.name === idName.name || p.name in instanceAPI.auth) &&
        !(p.name in instanceAPI.methods)
      ) {
        if (
          p.valueDeclaration &&
          ts.isPropertySignature(p.valueDeclaration) &&
          p.valueDeclaration.type
        ) {
          const v = p.valueDeclaration;
          const t = p.valueDeclaration.type;
          properties[p.name] = parser.withLoc(
            () =>
              getSchemaFromType(parser.checker.getTypeFromTypeNode(t), parser),
            v,
          );
          if (p.flags & ts.SymbolFlags.Optional) {
            properties[p.name] = parser.withLoc(
              () => ({
                kind: SchemaKind.Union,
                elements: [properties[p.name], {kind: SchemaKind.Void}],
              }),
              v,
            );
            // see code-gen/generateType for the nasty hack
            (properties[p.name] as any).isOptional = true;
          }
        }
      }
    });
  }
  if (
    className !== 'Root' &&
    !(idName.name in properties) &&
    !(idName.name in instanceAPI.methods)
  ) {
    throw parser.createError(
      `Could not find a property called "${
        idName.name
      }" in ${className}. Either define an ` +
        `id property called "${
          idName.name
        }" that returns a unique string for each object, ` +
        `or set the "idName" property to a property name that exists for your object.`,
      idName.loc,
    );
  }

  const exportedName = getExportName(node, parser);
  return {
    className,
    classData: {
      exportedName,
      loc: parser.getLocation(node),
      idName: idName.name,
      instanceAPI,
      staticAPI,
    },
  };
}
