class Priority {
  data: {
    [key: string]: number
  } = {}
  get(key: string) {
    return this.data[key]
  }
  set(key: string, val: number) {
    this.data[key] = val
  }
  del(key: string) {
    delete this.data[key]
  }
}
export const PRIORITY = new Priority()
