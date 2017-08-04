export const enum RichTextBrand {}

type RichText = RichTextBrand & {__html: string};

export default RichText;

export function validate(value: {__html: string}): value is RichText {
  // This would be checking that html has been sanitized
  return value.__html.indexOf('<') === -1;
}
