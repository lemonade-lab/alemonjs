export class Counter {
  private counter = 1
  constructor(initialValue: number) {
    this.counter = initialValue
  }
  public setID(initialValue: number) {
    this.counter = initialValue
  }
  public getID(): number {
    return this.counter
  }
  public getNextID(): number {
    return ++this.counter
  }
}
