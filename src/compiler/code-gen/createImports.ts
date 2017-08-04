export type Mapping = {[name: string]: {filename: string; exportName?: string}};
export interface Imports<T extends Mapping> {
  get(name: keyof T): keyof T;
  finish(): void;
}
export default function createImports<T extends Mapping>(
  result: string[],
  mapping: T,
): Imports<T> {
  const index = result.length;
  result.push('');
  const required = new Set<string>();
  return {
    get(name: keyof T): keyof T {
      if (!(name in mapping)) {
        throw new Error('Unsupported import name ' + name);
      }
      required.add(name);
      return name;
    },
    finish() {
      const statements: string[] = [];
      const files: {
        [filename: string]: {localName: string; exportName?: string}[];
      } = {};
      required.forEach(name => {
        const i = mapping[name];
        const f = files[i.filename] || (files[i.filename] = []);
        f.push({localName: name, exportName: i.exportName});
      });
      Object.keys(files).forEach(filename => {
        const specifiers = files[filename].filter(s => s.exportName !== '*');
        const defaultImport = specifiers.filter(s => !s.exportName)[0];
        const starImport = files[filename].filter(s => s.exportName === '*')[0];
        if (specifiers.length) {
          statements.push(
            `import ${defaultImport
              ? defaultImport.localName + ', '
              : ''}{${specifiers
              .filter(s => s.exportName)
              .map(s => {
                if (s.exportName === s.localName) return s.localName;
                else return s.exportName + ' as ' + s.localName;
              })
              .join(', ')}} from '${filename}';`,
          );
        }
        if (starImport) {
          statements.push(
            `import * as ${starImport.localName} from '${filename}';`,
          );
        }
      });
      result[index] = statements.join('\n');
    },
  };
}
