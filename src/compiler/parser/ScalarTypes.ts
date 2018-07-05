/**
 * @generated opaque-types
 */

export type ScalarID__Base = string;
declare const ScalarID__Symbol: unique symbol;

declare class ScalarID__Class {
  private __kind: typeof ScalarID__Symbol;
}

/**
 * @opaque
 * @base ScalarID__Base
 */
type ScalarID = ScalarID__Class;
const ScalarID = {
  extract(value: ScalarID): ScalarID__Base {
    return value as any;
  },

  unsafeCast(value: ScalarID__Base): ScalarID {
    return value as any;
  },
};
export {ScalarID};
export type ScalarName__Base = string;
declare const ScalarName__Symbol: unique symbol;

declare class ScalarName__Class {
  private __kind: typeof ScalarName__Symbol;
}

/**
 * @expose
 * @opaque
 * @base ScalarName__Base
 */
type ScalarName = ScalarName__Base & ScalarName__Class;
const ScalarName = {
  extract(value: ScalarName): ScalarName__Base {
    return value;
  },

  unsafeCast(value: ScalarName__Base): ScalarName {
    return value as any;
  },
};
export {ScalarName};
