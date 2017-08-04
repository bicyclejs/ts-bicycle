import ValueType, {LocationInfo} from 'bicycle/types/ValueType';

export interface ParsedMethod {
  args: ValueType;
  result: ValueType;
  length: number;
}

export default interface ParsedObject {
  exportedName: string;
  loc: LocationInfo;
  idName: string;
  data: ValueType;
  methods: {[name: string]: ParsedMethod};
  staticMethods: {[name: string]: ParsedMethod};
  auth: {[propertyName: string]: string};
  staticAuth: {[mutationName: string]: string};
};
