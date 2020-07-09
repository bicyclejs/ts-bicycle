// @opaque
// @expose
type Email = string;
const Email = {
  isValid(value: string): value is Email {
    return value.indexOf('@') !== -1;
  },
};
export default Email;
