export class Counter {
  #counter = 1
  #val = 0
  constructor(initialValue: number) {
    this.#counter = initialValue
    this.#val = initialValue
  }
  public getNextId(): number {
    return ++this.#counter
  }
  public get() {
    return this.#counter
  }
  public reStart() {
    this.#counter = this.#val
  }
}
