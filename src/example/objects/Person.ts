import Object from 'bicycle/BaseObject';

import Context from '../Context';

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
    public: ['id', 'name'],
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
