class Msg {
  data: {
    [key: string]: (...args: any[]) => any | Promise<any>
  } = {}
  get(key: string) {
    return this.data[key]
  }
  set(key: string, fnc: (...args: any[]) => any | Promise<any>) {
    this.data[key] = fnc
  }
  del(key: string) {
    delete this.data[key]
  }
}
export const MSG = new Msg()
