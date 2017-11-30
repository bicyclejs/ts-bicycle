const prettier = require('prettier');

export default async function formatResult(
  src: string,
  filename: string,
): Promise<string> {
  const options = (await prettier.resolveConfig(filename, {})) || {};
  options.parser = 'typescript';
  return prettier.format(src, options);
}
