const prettier = require('prettier');

export default async function formatResult(
  src: string,
  filename: string,
): Promise<string> {
  const options = (await prettier.resolveConfig(filename, {})) || {};
  options.parser = 'typescript';
  // run prettier until it stabalises
  // workaround for https://github.com/prettier/prettier/issues/3823
  let formatted = '';
  let next = '';
  let i = 0;
  do {
    formatted = next;
    next = prettier.format(src, options);
    i++;
  } while (formatted !== next && i < 20);
  return formatted;
}
