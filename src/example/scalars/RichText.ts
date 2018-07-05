/**
 * @generated opaque-types
 */

export type RichText__Base = any;
declare const RichText__Symbol: unique symbol;

declare class RichText__Class {
  private __kind: typeof RichText__Symbol;
}

/**
 * @opaque
 * @base RichText__Base
 */
type RichText = RichText__Class;
const RichText = {
  cast(value: RichText__Base): RichText {
    if (!RichText.isValid(value)) {
      throw new TypeError(
        'Expected "RichText" but got: ' + JSON.stringify(value),
      );
    }

    return value as any;
  },

  extract(value: RichText): RichText__Base {
    return value as any;
  },

  unsafeCast(value: RichText__Base): RichText {
    return value as any;
  },

  isValid(value: any): value is RichText {
    // You can use any approach to validating a json schema here
    return false;
  },
};
export default RichText;
