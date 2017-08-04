import {relative, dirname} from 'path';
import AST, {Scalar} from '../AST';
import generateHeader from './generateHeader';

export function getValidationFunctionName(scalar: Scalar) {
  return 'validate' + scalar.name;
}
export function getScalarValidateFunctionImportStatement(
  scalar: Scalar,
  outputDirName: string,
) {
  const exportedName = scalar.validatorName;
  const validateName = getValidationFunctionName(scalar);
  const specifier =
    exportedName === 'default'
      ? validateName
      : exportedName === validateName
        ? `{${validateName}}`
        : `{${exportedName} as ${validateName}}`;
  const source =
    './' + relative(outputDirName, scalar.validatorLocation.fileName).replace(/\.tsx?$/, '');
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
    './' + relative(outputDirName, scalar.validatorLocation.fileName).replace(/\.tsx?$/, '');
  return `import ${specifier} from '${source}';`;
}
export default function generateScalars(ast: AST, outputFileName: string) {
  const scalars = Object.keys(ast.scalars)
    .sort()
    .map(name => ast.scalars[name]);
  const result: string[] = [];
  result.push(generateHeader());
  const outputDirName = dirname(outputFileName);
  scalars.forEach(scalar => {
    result.push(getScalarImportStatement(scalar, outputDirName));
  });
  result.push(``);
  scalars.forEach(scalar => {
    result.push(`export {${scalar.name}};`);
  });
  result.push(``);

  return result.join('\n');
}
