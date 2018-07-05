/**
 * @generated opaque-types
 */

export type Email2__Base = string;
declare const Email2__Symbol: unique symbol;

declare class Email2__Class {
  private __kind: typeof Email2__Symbol;
}

/**
 * @expose
 * @opaque
 * @base Email2__Base
 */
type Email2 = Email2__Base & Email2__Class;
const Email2 = {
  cast(value: Email2__Base): Email2 {
    if (!Email2.isValid(value)) {
      throw new TypeError(
        'Expected "Email2" but got: ' + JSON.stringify(value),
      );
    }

    return value as any;
  },

  extract(value: Email2): Email2__Base {
    return value;
  },

  unsafeCast(value: Email2__Base): Email2 {
    return value as any;
  },

  isValid(value: string): value is Email2 {
    return value.indexOf('@') !== -1;
  },
};
export default Email2;
