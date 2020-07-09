// generated by ts-bicycle
// do not edit by hand

import {
  BaseQuery,
  merge,
  addField,
  Mutation,
  BaseRootQuery,
  stringify,
} from 'bicycle/typed-helpers/query';
import * as ScalarTypes from './scalar-types';
import {RootCache, GetOptimisticValue} from './optimistic';

export class InviteQuery<TResult = {}> extends BaseQuery<TResult> {
  // fields

  merge<TOther>(other: InviteQuery<TOther>): InviteQuery<TResult & TOther> {
    return new InviteQuery(merge(this._query, other._query));
  }

  // mutations
}
export class PersonQuery<TResult = {}> extends BaseQuery<TResult> {
  // fields
  get id(): PersonQuery<TResult & {id: number}> {
    return new PersonQuery(addField(this._query, 'id', true));
  }
  get name(): PersonQuery<TResult & {name: null | string}> {
    return new PersonQuery(addField(this._query, 'name', true));
  }
  friends<TPerson>(
    Person: PersonQuery<TPerson>,
  ): PersonQuery<TResult & {friends: TPerson[]}> {
    return new PersonQuery(
      addField(this._query, 'friends', (Person as any)._query),
    );
  }
  enemies<TPerson>(
    Person: PersonQuery<TPerson>,
  ): PersonQuery<TResult & {enemies: TPerson[]}> {
    return new PersonQuery(
      addField(this._query, 'enemies', (Person as any)._query),
    );
  }
  get objectWithOptionalProperty(): PersonQuery<
    TResult & {objectWithOptionalProperty: {foo?: string}}
  > {
    return new PersonQuery(
      addField(this._query, 'objectWithOptionalProperty', true),
    );
  }
  get enumField(): PersonQuery<TResult & {enumField: ScalarTypes.MyEnum}> {
    return new PersonQuery(addField(this._query, 'enumField', true));
  }
  get enumSubsetField(): PersonQuery<
    TResult & {enumSubsetField: ScalarTypes.MyEnum.a | ScalarTypes.MyEnum.b}
  > {
    return new PersonQuery(addField(this._query, 'enumSubsetField', true));
  }
  get anyField(): PersonQuery<TResult & {anyField: any}> {
    return new PersonQuery(addField(this._query, 'anyField', true));
  }

  merge<TOther>(other: PersonQuery<TOther>): PersonQuery<TResult & TOther> {
    return new PersonQuery(merge(this._query, other._query));
  }

  // mutations
  set(
    args: {field: string; value: string},
    optimisticUpdate?: (
      mutation: {
        objectName: 'Person';
        methodName: 'set';
        args: {field: string; value: string};
      },
      cache: RootCache,
      getOptimisticValue: GetOptimisticValue,
    ) => any,
  ): Mutation<void> {
    return new Mutation('Person.set', args, optimisticUpdate as any);
  }
}
export class RootQuery<TResult = {}> extends BaseRootQuery<TResult> {
  // fields
  people<TPerson>(
    Person: PersonQuery<TPerson>,
  ): RootQuery<TResult & {people: TPerson[]}> {
    return new RootQuery(
      addField(this._query, 'people', (Person as any)._query),
    );
  }
  person<TPerson>(
    args: number,
    Person: PersonQuery<TPerson>,
  ): RootQuery<TResult & {person: TPerson}> {
    return new RootQuery(
      addField(
        this._query,
        args === undefined ? 'person' : 'person(' + stringify(args) + ')',
        (Person as any)._query,
      ),
    );
  }
  peopleByEmail<TPerson>(
    args: ScalarTypes.Email,
    Person: PersonQuery<TPerson>,
  ): RootQuery<TResult & {peopleByEmail: TPerson[]}> {
    return new RootQuery(
      addField(
        this._query,
        args === undefined
          ? 'peopleByEmail'
          : 'peopleByEmail(' + stringify(args) + ')',
        (Person as any)._query,
      ),
    );
  }
  get page(): RootQuery<TResult & {page: ScalarTypes.RichText}> {
    return new RootQuery(addField(this._query, 'page', true));
  }
  get nullOrBooleanPromise(): RootQuery<
    TResult & {nullOrBooleanPromise: null | false | true}
  > {
    return new RootQuery(addField(this._query, 'nullOrBooleanPromise', true));
  }
  get someSpecificString(): RootQuery<
    TResult & {someSpecificString: 'Hello' | 'World'}
  > {
    return new RootQuery(addField(this._query, 'someSpecificString', true));
  }

  merge<TOther>(other: RootQuery<TOther>): RootQuery<TResult & TOther> {
    return new RootQuery(merge(this._query, other._query));
  }

  // mutations
}
