export class Counter {
  private counter = 1
  constructor(initialValue: number) {
    this.counter = initialValue
  }
  public getNextID(): number {
    return ++this.counter
  }
}
