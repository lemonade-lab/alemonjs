class App {
  data: {
    [key: string]: any
  } = {}
  get(key: string) {
    return this.data[key]
  }
  set(key: string, val: any) {
    this.data[key] = val
  }
  del(key: string) {
    delete this.data[key]
  }
  getAllKey() {
    const arr = []
    for (const key in this.data) {
      arr.push(key)
    }
    return arr
  }
}
export const APP = new App()
