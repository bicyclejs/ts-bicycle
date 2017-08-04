import ParsedObject from './ParsedObject';
import ValueType, {LocationInfo} from 'bicycle/types/ValueType';

export interface Scalar {
  type: ValueType;
  brandName: string;
  name: string;
  exportName: string;
  aliasLocation: LocationInfo;
  validatorName: string;
  validatorLocation: LocationInfo;
}
export default interface AST {
  classes: {[className: string]: ParsedObject};
  context: {exportName: string; fileName: string}[];
  scalars: {[scalarName: string]: Scalar};
};
