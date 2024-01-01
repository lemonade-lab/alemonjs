class Event {
  data: {
    [key: string]: 'MESSAGES' | 'message'
  } = {}
  get(key: string) {
    return this.data[key]
  }
  set(key: string, val: 'MESSAGES' | 'message') {
    this.data[key] = val
  }
  del(key: string) {
    delete this.data[key]
  }
}
export const EVENT = new Event()
