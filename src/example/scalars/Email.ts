/**
 * @generated opaque-types
 */

export type Email__Base = string;
declare const Email__Symbol: unique symbol;

declare class Email__Class {
  private __kind: typeof Email__Symbol;
}

/**
 * @expose
 * @opaque
 * @base Email__Base
 */
type Email = Email__Base & Email__Class;
const Email = {
  cast(value: Email__Base): Email {
    if (!Email.isValid(value)) {
      throw new TypeError('Expected "Email" but got: ' + JSON.stringify(value));
    }

    return value as any;
  },

  extract(value: Email): Email__Base {
    return value;
  },

  unsafeCast(value: Email__Base): Email {
    return value as any;
  },

  isValid(value: string): value is Email {
    return value.indexOf('@') !== -1;
  },
};
export default Email;
