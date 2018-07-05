// @opaque
// @expose
type Email2 = string;
const Email2 = {
  isValid(value: string): value is Email2 {
    return value.indexOf('@') !== -1;
  },
};
export default Email2;
