export const enum EmailBrand {}

type Email = EmailBrand & string;

export default Email;

export function validateEmail(value: string): value is Email {
  return value.indexOf('@') !== -1;
}
