import normalizeSlashes from './normalizeSlashes';

export default function shortenFileNames<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(shortenFileNames) as any;
  }
  if (obj && typeof obj === 'object') {
    const result = {};
    Object.keys(obj).forEach(key => {
      if (key === 'programFiles') {
        result[key] = obj[key].map((filename: string) =>
          normalizeSlashes(filename.split('ts-bicycle').pop()!),
        );
      } else if (key === 'fileName') {
        result[key] = normalizeSlashes(
          (obj[key] as string).split('ts-bicycle').pop()!,
        );
      } else {
        result[key] = shortenFileNames(obj[key]);
      }
    });
    return result as any;
  }
  return obj;
}
