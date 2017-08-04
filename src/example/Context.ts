export default class Context {
  id: number;
  constructor(userID: number) {
    this.id = userID;
  }
  dispose() {}
}
