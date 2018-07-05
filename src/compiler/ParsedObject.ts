import ValueType, {LocationInfo} from 'bicycle/types/ValueType';

export interface ParsedMethod {
  name: string;
  args: ValueType;
  result: ValueType;
  length: number;
}

export interface ResolvedAPI {
  auth: {[propertyName: string]: string};
  authMethods: {[key: string]: ParsedMethod};
  methods: {[key: string]: ParsedMethod};
  properties?: {[key: string]: ValueType};
}
export default interface ParsedObject {
  exportedName: string;
  loc: LocationInfo;
  idName: string;
  instanceAPI: ResolvedAPI;
  staticAPI: ResolvedAPI;
}
