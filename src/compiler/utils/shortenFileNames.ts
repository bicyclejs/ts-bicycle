import normalizeSlashes from './normalizeSlashes';

export default function shortenFileNames(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(shortenFileNames);
  }
  if (obj && typeof obj === 'object') {
    const result = {};
    Object.keys(obj).forEach(key => {
      if (key === 'fileName') {
        result[key] = normalizeSlashes(obj[key].split('ts-bicycle').pop());
      } else {
        result[key] = shortenFileNames(obj[key]);
      }
    });
    return result;
  }
  return obj;
}
