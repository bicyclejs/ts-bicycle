import {relative, dirname} from 'path';
import AST, {Scalar} from '../AST';
import generateHeader from './generateHeader';

export function getValidationFunctionName(scalar: Scalar) {
  return scalar.validatorName.indexOf('.') !== -1
    ? scalar.name + 'Validator.isValid'
    : 'validate' + scalar.name;
}
export function getScalarValidateFunctionImportStatement(
  scalar: Scalar,
  outputDirName: string,
) {
  const exportedName = scalar.validatorName.split('.')[0];
  const validateName =
    scalar.validatorName.indexOf('.') !== -1
      ? scalar.name + 'Validator'
      : 'validate' + scalar.name;
  const specifier =
    exportedName === 'default'
      ? validateName
      : exportedName === validateName
        ? `{${validateName}}`
        : `{${exportedName} as ${validateName}}`;
  const source =
    './' +
    relative(outputDirName, scalar.validatorLocation.fileName).replace(
      /\.tsx?$/,
      '',
    );
  return `import ${specifier} from '${source}';`;
}
export function getScalarImportStatement(
  scalar: Scalar,
  outputDirName: string,
) {
  const exportedName = scalar.exportName;
  const localName = scalar.name;
  const specifier =
    exportedName === 'default'
      ? localName
      : exportedName === localName
        ? `{${localName}}`
        : `{${exportedName} as ${localName}}`;
  const source =
    './' +
    relative(outputDirName, scalar.validatorLocation.fileName).replace(
      /\.tsx?$/,
      '',
    );
  return `import ${specifier} from '${source}';`;
}
export default function generateScalars(ast: AST, outputFileName: string) {
  const scalars = Object.keys(ast.scalars)
    .sort()
    .map(name => ast.scalars[name]);
  const enums = Object.keys(ast.enums)
    .sort()
    .filter(name => !(name in ast.scalars))
    .map(name => ast.enums[name]);
  const result: string[] = [];
  result.push(generateHeader());
  const outputDirName = dirname(outputFileName);
  scalars.forEach(scalar => {
    result.push(getScalarImportStatement(scalar, outputDirName));
  });
  enums.forEach(enumDef => {
    const specifier =
      enumDef.exportName === 'default'
        ? enumDef.name
        : enumDef.exportName === enumDef.name
          ? `{${enumDef.name}}`
          : `{${enumDef.exportName} as ${enumDef.name}}`;
    const source =
      './' +
      relative(outputDirName, enumDef.location.fileName).replace(/\.tsx?$/, '');
    result.push(`import ${specifier} from '${source}'`);
  });
  result.push(``);
  scalars.forEach(scalar => {
    result.push(`export {${scalar.name}};`);
  });
  enums.forEach(enumDef => {
    result.push(`export {${enumDef.name}};`);
  });
  result.push(``);

  return result.join('\n');
}
