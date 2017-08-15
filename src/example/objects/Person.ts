import Object from 'bicycle/BaseObject';

import Context from '../Context';
import MyEnum from '../scalars/MyEnum';

export interface PersonDataLink {
  person: Person;
  linkType: 'friend' | 'enemy';
}

export interface PersonData {
  id: number;
  name: string | null;
  links: PersonDataLink[];
}

export default class Person extends Object<PersonData> {
  $auth = {
    public: ['id', 'name', 'objectWithOptionalProperty', 'enumField'],
    isSelf: ['friends', 'enemies'],
  };
  $isSelf(args: {} | void, ctx: Context): boolean {
    return ctx.id === this.data.id;
  }
  // calculated fields
  async friends(args: void, context: Context): Promise<Person[]> {
    return this.data.links
      .filter(link => link.linkType === 'friend')
      .map(link => link.person);
  }
  async enemies(args: void, context: Context): Promise<Person[]> {
    return this.data.links
      .filter(link => link.linkType === 'enemy')
      .map(link => link.person);
  }

  objectWithOptionalProperty(): {foo?: string} {
    return {};
  }
  enumField(): MyEnum {
    return MyEnum.a;
  }

  // any is not yet supported, but we don't expose this field so it's all good
  anyField(): any {
    return Math.random() > 0.5 ? 42 : {[Math.random()]: 42};
  }

  static $auth = {
    public: ['set'],
  };
  // mutations
  static async set(args: {field: string; value: string}, context: Context) {}
}

const p = new Person({id: 10, name: 'Forbes', links: []});
export function getPublic(foo: number, ctx: Context) {
  return p.$isSelf(foo, ctx);
}
