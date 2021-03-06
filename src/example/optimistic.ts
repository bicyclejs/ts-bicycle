// generated by ts-bicycle
// do not edit by hand

import {GetOptimisticValue} from 'bicycle/client/optimistic';
import * as ScalarTypes from './scalar-types';

export {GetOptimisticValue};

export interface InviteOptimisticUpdaters {}
export interface InviteCache {}
export interface PersonOptimisticUpdaters {
  set?: (
    mutation: {
      objectName: 'Person';
      methodName: 'set';
      args: {field: string; value: string};
    },
    cache: RootCache,
    getOptimisticValue: GetOptimisticValue,
  ) => any;
}
export interface PersonCache {
  get(name: 'id'): void | number;
  get(name: 'name'): void | (null | string);
  get(name: 'friends'): void | PersonCache[];
  get(name: 'enemies'): void | PersonCache[];
  get(name: 'objectWithOptionalProperty'): void | {foo?: string};
  get(name: 'enumField'): void | ScalarTypes.MyEnum;
  get(
    name: 'enumSubsetField',
  ): void | (ScalarTypes.MyEnum.a | ScalarTypes.MyEnum.b);
  get(name: 'anyField'): void | any;
  set(name: 'id', value: number): this;
  set(name: 'name', value: null | string): this;
  set(name: 'friends', value: PersonCache[]): this;
  set(name: 'enemies', value: PersonCache[]): this;
  set(name: 'objectWithOptionalProperty', value: {foo?: string}): this;
  set(name: 'enumField', value: ScalarTypes.MyEnum): this;
  set(
    name: 'enumSubsetField',
    value: ScalarTypes.MyEnum.a | ScalarTypes.MyEnum.b,
  ): this;
  set(name: 'anyField', value: any): this;
}
export interface RootOptimisticUpdaters {}
export interface RootCache {
  get(name: 'people'): void | PersonCache[];
  get(name: 'person', args: number): void | PersonCache;
  get(name: 'peopleByEmail', args: ScalarTypes.Email): void | PersonCache[];
  get(name: 'page'): void | ScalarTypes.RichText;
  get(name: 'nullOrBooleanPromise'): void | (null | false | true);
  get(name: 'someSpecificString'): void | ('Hello' | 'World');
  set(name: 'people', value: PersonCache[]): this;
  set(name: 'person', args: number, value: PersonCache): this;
  set(
    name: 'peopleByEmail',
    args: ScalarTypes.Email,
    value: PersonCache[],
  ): this;
  set(name: 'page', value: ScalarTypes.RichText): this;
  set(name: 'nullOrBooleanPromise', value: null | false | true): this;
  set(name: 'someSpecificString', value: 'Hello' | 'World'): this;
  getObject(typeName: 'Invite', id: string): InviteCache;
  getObject(typeName: 'Person', id: string): PersonCache;
}
export default interface OptimisticUpdaters {
  Invite?: InviteOptimisticUpdaters;
  Person?: PersonOptimisticUpdaters;
  Root?: RootOptimisticUpdaters;
}
