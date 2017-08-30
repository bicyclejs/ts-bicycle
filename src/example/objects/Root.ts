import BaseObject from 'bicycle/BaseObject';

import Context from '../Context';

import Person from './Person';
import Email, {validateEmail} from '../scalars/Email';
import RichText from '../scalars/RichText';

export class Root extends BaseObject<{}> {
  $auth = {
    public: ['people', 'person', 'peopleByEmail', 'page'],
  };
  async people(args: void, context: Context): Promise<Person[]> {
    return [];
  }
  async person(id: number, context: Context): Promise<Person> {
    return new Person({id, name: 'Forbes', links: []});
  }
  async peopleByEmail(args: Email, context: Context): Promise<Person[]> {
    // you can use the branded type as a base type without any special conversion
    const e: string = args;
    console.log(e);
    // you can use the validate function to add the brand
    if (validateEmail(e)) {
      const a: Email = e;
      console.log(a);
    }
    return [];
  }
  page(): RichText {
    return {} as RichText;
  }
}
