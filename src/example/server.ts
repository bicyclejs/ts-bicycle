// generated by ts-bicycle
// do not edit by hand

import Schema from 'bicycle/types/Schema';
import SchemaKind from 'bicycle/types/SchemaKind';
import QueryContext from 'bicycle/types/QueryContext';
import Query from 'bicycle/types/Query';
import * as ScalarTypes from './scalar-types';
import MutationContext from 'bicycle/types/MutationContext';
import BicycleServer, {Options} from 'bicycle/server-core';
import Invite from './objects/Other';
import Person from './objects/Person';
import {Root} from './objects/Root';
import {validateEmail} from './scalars/Email';
import Email2Validator from './scalars/Email2';
import RichTextValidator from './scalars/RichText';
import _Context0 from './Context';

// root never has any actual data, so we create one reusable instance
const root = new Root({});
const schema: Schema<_Context0> = {
  Invite: {
    kind: SchemaKind.NodeType,
    name: 'Invite',
    description: undefined,
    id(obj: Invite, ctx: _Context0, qCtx: QueryContext<_Context0>): string {
      return '' + obj.data.id;
    },
    matches(obj: any): obj is Invite {
      return obj instanceof Invite;
    },
    fields: {},
    mutations: {},
  },
  Person: {
    kind: SchemaKind.NodeType,
    name: 'Person',
    description: undefined,
    id(obj: Person, ctx: _Context0, qCtx: QueryContext<_Context0>): string {
      return '' + obj.data.id;
    },
    matches(obj: any): obj is Person {
      return obj instanceof Person;
    },
    fields: {
      id: {
        kind: SchemaKind.FieldMethod,
        name: 'id',
        description: undefined,
        resultType: {
          kind: 'Number',
          loc: {fileName: '/src/example/objects/Person.ts', line: 12},
        } as any,
        argType: {kind: SchemaKind.Void},
        auth: 'public',
        resolve(
          value: Person,
          args: void,
          context: _Context0,
          subQuery: true | Query,
          qCtx: QueryContext<_Context0>,
        ): number {
          return value.data.id;
        },
      },
      name: {
        kind: SchemaKind.FieldMethod,
        name: 'name',
        description: undefined,
        resultType: {
          kind: 'Union',
          elements: [{kind: 'Null'}, {kind: 'String'}],
          loc: {fileName: '/src/example/objects/Person.ts', line: 13},
        } as any,
        argType: {kind: SchemaKind.Void},
        auth: 'public',
        resolve(
          value: Person,
          args: void,
          context: _Context0,
          subQuery: true | Query,
          qCtx: QueryContext<_Context0>,
        ): null | string {
          return value.data.name;
        },
      },
      anyField: {
        kind: SchemaKind.FieldMethod,
        name: 'anyField',
        description: undefined,
        resultType: {
          kind: 'Any',
          loc: {fileName: '/src/example/objects/Person.ts', line: 50},
        } as any,
        argType: {kind: 'Void'} as any,
        auth: 'public',
        resolve(
          value: Person,
          args: void,
          context: _Context0,
          subQuery: true | Query,
          qCtx: QueryContext<_Context0>,
        ): any | PromiseLike<any> {
          return value.anyField();
        },
      },
      enemies: {
        kind: SchemaKind.FieldMethod,
        name: 'enemies',
        description: undefined,
        resultType: {
          kind: 'List',
          element: {kind: 'Named', name: 'Person'},
        } as any,
        argType: {
          kind: 'Void',
          loc: {fileName: '/src/example/objects/Person.ts', line: 37},
        } as any,
        auth(
          value: Person,
          args: void,
          context: _Context0,
          subQuery: true | Query,
          qCtx: QueryContext<_Context0>,
        ): boolean | PromiseLike<boolean> {
          return value.$isSelf(args, context);
        },
        resolve(
          value: Person,
          args: void,
          context: _Context0,
          subQuery: true | Query,
          qCtx: QueryContext<_Context0>,
        ): Person[] | PromiseLike<Person[]> {
          return value.enemies(args, context);
        },
      },
      enumField: {
        kind: SchemaKind.FieldMethod,
        name: 'enumField',
        description: undefined,
        resultType: {
          kind: 'Union',
          elements: [
            {kind: 'Literal', value: 10},
            {kind: 'Literal', value: 20},
          ],
          enumDeclaration: 'MyEnum',
          loc: {fileName: '/src/example/objects/Person.ts', line: 46},
        } as any,
        argType: {kind: 'Void'} as any,
        auth: 'public',
        resolve(
          value: Person,
          args: void,
          context: _Context0,
          subQuery: true | Query,
          qCtx: QueryContext<_Context0>,
        ): ScalarTypes.MyEnum | PromiseLike<ScalarTypes.MyEnum> {
          return value.enumField();
        },
      },
      friends: {
        kind: SchemaKind.FieldMethod,
        name: 'friends',
        description: undefined,
        resultType: {
          kind: 'List',
          element: {kind: 'Named', name: 'Person'},
        } as any,
        argType: {
          kind: 'Void',
          loc: {fileName: '/src/example/objects/Person.ts', line: 32},
        } as any,
        auth(
          value: Person,
          args: void,
          context: _Context0,
          subQuery: true | Query,
          qCtx: QueryContext<_Context0>,
        ): boolean | PromiseLike<boolean> {
          return value.$isSelf(args, context);
        },
        resolve(
          value: Person,
          args: void,
          context: _Context0,
          subQuery: true | Query,
          qCtx: QueryContext<_Context0>,
        ): Person[] | PromiseLike<Person[]> {
          return value.friends(args, context);
        },
      },
      objectWithOptionalProperty: {
        kind: SchemaKind.FieldMethod,
        name: 'objectWithOptionalProperty',
        description: undefined,
        resultType: {
          kind: 'Object',
          properties: {
            foo: {
              kind: 'Union',
              elements: [
                {
                  kind: 'String',
                  loc: {fileName: '/src/example/objects/Person.ts', line: 43},
                },
                {kind: 'Void'},
              ],
              loc: {fileName: '/src/example/objects/Person.ts', line: 43},
              isOptional: true,
            },
          },
          loc: {fileName: '/src/example/objects/Person.ts', line: 43},
        } as any,
        argType: {kind: 'Void'} as any,
        auth: 'public',
        resolve(
          value: Person,
          args: void,
          context: _Context0,
          subQuery: true | Query,
          qCtx: QueryContext<_Context0>,
        ): {foo?: string} | PromiseLike<{foo?: string}> {
          return value.objectWithOptionalProperty();
        },
      },
    },
    mutations: {
      set: {
        kind: SchemaKind.Mutation,
        name: 'set',
        description: undefined,
        resultType: {kind: 'Void'} as any,
        argType: {
          kind: 'Object',
          properties: {
            field: {
              kind: 'String',
              loc: {fileName: '/src/example/objects/Person.ts', line: 58},
            },
            value: {
              kind: 'String',
              loc: {fileName: '/src/example/objects/Person.ts', line: 58},
            },
          },
          loc: {fileName: '/src/example/objects/Person.ts', line: 58},
        } as any,
        auth: 'public',
        resolve(
          args: {field: string; value: string},
          context: _Context0,
          mCtx: MutationContext<_Context0>,
        ): void | PromiseLike<void> {
          return Person.set(args, context);
        },
      },
    },
  },
  Root: {
    kind: SchemaKind.NodeType,
    name: 'Root',
    description: undefined,
    id(): string {
      return 'root';
    },
    matches(obj: any): obj is Root {
      return obj instanceof Root;
    },
    fields: {
      nullOrBooleanPromise: {
        kind: SchemaKind.FieldMethod,
        name: 'nullOrBooleanPromise',
        description: undefined,
        resultType: {
          kind: 'Union',
          elements: [
            {kind: 'Null'},
            {kind: 'Literal', value: true},
            {kind: 'Literal', value: false},
          ],
        } as any,
        argType: {kind: 'Void'} as any,
        auth: 'public',
        resolve(
          value: {},
          args: void,
          context: _Context0,
          subQuery: true | Query,
          qCtx: QueryContext<_Context0>,
        ): (null | true | false) | PromiseLike<null | true | false> {
          return root.nullOrBooleanPromise();
        },
      },
      page: {
        kind: SchemaKind.FieldMethod,
        name: 'page',
        description: undefined,
        resultType: {
          kind: 'Named',
          name: 'RichText',
          loc: {fileName: '/src/example/objects/Root.ts', line: 50},
        } as any,
        argType: {kind: 'Void'} as any,
        auth: 'public',
        resolve(
          value: {},
          args: void,
          context: _Context0,
          subQuery: true | Query,
          qCtx: QueryContext<_Context0>,
        ): ScalarTypes.RichText | PromiseLike<ScalarTypes.RichText> {
          return root.page();
        },
      },
      people: {
        kind: SchemaKind.FieldMethod,
        name: 'people',
        description: undefined,
        resultType: {
          kind: 'List',
          element: {kind: 'Named', name: 'Person'},
        } as any,
        argType: {
          kind: 'Void',
          loc: {fileName: '/src/example/objects/Root.ts', line: 22},
        } as any,
        auth: 'public',
        resolve(
          value: {},
          args: void,
          context: _Context0,
          subQuery: true | Query,
          qCtx: QueryContext<_Context0>,
        ): Person[] | PromiseLike<Person[]> {
          return root.people(args, context);
        },
      },
      peopleByEmail: {
        kind: SchemaKind.FieldMethod,
        name: 'peopleByEmail',
        description: undefined,
        resultType: {
          kind: 'List',
          element: {kind: 'Named', name: 'Person'},
        } as any,
        argType: {
          kind: 'Named',
          name: 'Email',
          loc: {fileName: '/src/example/objects/Root.ts', line: 39},
        } as any,
        auth: 'public',
        resolve(
          value: {},
          args: ScalarTypes.Email,
          context: _Context0,
          subQuery: true | Query,
          qCtx: QueryContext<_Context0>,
        ): Person[] | PromiseLike<Person[]> {
          return root.peopleByEmail(args, context);
        },
      },
      peopleByEmail2: {
        kind: SchemaKind.FieldMethod,
        name: 'peopleByEmail2',
        description: undefined,
        resultType: {
          kind: 'List',
          element: {kind: 'Named', name: 'Person'},
        } as any,
        argType: {
          kind: 'Named',
          name: 'Email2',
          loc: {fileName: '/src/example/objects/Root.ts', line: 28},
        } as any,
        auth: 'public',
        resolve(
          value: {},
          args: ScalarTypes.Email2,
          context: _Context0,
          subQuery: true | Query,
          qCtx: QueryContext<_Context0>,
        ): Person[] | PromiseLike<Person[]> {
          return root.peopleByEmail2(args, context);
        },
      },
      person: {
        kind: SchemaKind.FieldMethod,
        name: 'person',
        description: undefined,
        resultType: {kind: 'Named', name: 'Person'} as any,
        argType: {
          kind: 'Number',
          loc: {fileName: '/src/example/objects/Root.ts', line: 25},
        } as any,
        auth: 'public',
        resolve(
          value: {},
          args: number,
          context: _Context0,
          subQuery: true | Query,
          qCtx: QueryContext<_Context0>,
        ): Person | PromiseLike<Person> {
          return root.person(args, context);
        },
      },
      someSpecificString: {
        kind: SchemaKind.FieldMethod,
        name: 'someSpecificString',
        description: undefined,
        resultType: {
          kind: 'Union',
          elements: [
            {kind: 'Literal', value: 'Hello'},
            {kind: 'Literal', value: 'World'},
          ],
          loc: {fileName: '/src/example/objects/Root.ts', line: 56},
        } as any,
        argType: {kind: 'Void'} as any,
        auth: 'public',
        resolve(
          value: {},
          args: void,
          context: _Context0,
          subQuery: true | Query,
          qCtx: QueryContext<_Context0>,
        ): ('Hello' | 'World') | PromiseLike<'Hello' | 'World'> {
          return root.someSpecificString();
        },
      },
    },
    mutations: {},
  },
  Email: {
    kind: SchemaKind.Scalar,
    name: 'Email',
    description: undefined,
    baseType: {
      kind: 'String',
      loc: {fileName: '/src/example/scalars/Email.ts', line: 7},
    } as any,
    validate: validateEmail,
  },
  Email2: {
    kind: SchemaKind.Scalar,
    name: 'Email2',
    description: undefined,
    baseType: {
      kind: 'String',
      loc: {fileName: '/src/example/scalars/Email2.ts', line: 5},
    } as any,
    validate: Email2Validator.isValid,
  },
  RichText: {
    kind: SchemaKind.Scalar,
    name: 'RichText',
    description: undefined,
    baseType: {
      kind: 'Any',
      loc: {fileName: '/src/example/scalars/RichText.ts', line: 5},
    } as any,
    validate: RichTextValidator.isValid,
  },
};
export {Options};
export default class Server extends BicycleServer<_Context0> {
  constructor(options?: Options) {
    super(schema, options);
  }
}
