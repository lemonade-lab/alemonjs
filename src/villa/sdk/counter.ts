export class Counter {
  private counter = 1
  private val = 0
  constructor(initialValue: number) {
    this.counter = initialValue
    this.val = initialValue
  }
  public getNextID(): number {
    return ++this.counter
  }
  public get() {
    return this.counter
  }
  public reStart() {
    this.counter = this.val
  }
}
