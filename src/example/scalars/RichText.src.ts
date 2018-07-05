// @opaque
type RichText = any;
const RichText = {
  isValid(value: any): value is RichText {
    // You can use any approach to validating a json schema here
    return false;
  },
};

export {RichText};
