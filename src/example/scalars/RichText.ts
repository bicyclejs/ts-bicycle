const enum RichText {}

export default RichText;

export function validate(value: any): value is RichText {
  // You can use any approach to validating a json schema here
  return false;
}
