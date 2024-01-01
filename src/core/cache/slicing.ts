class Slicing {
  data: {
    [key: string]: {
      str: string
      reg: RegExp
    }[]
  } = {}
  get(key: string) {
    return this.data[key]
  }
  set(
    key: string,
    val: {
      str: string
      reg: RegExp
    }
  ) {
    if (!Object.prototype.hasOwnProperty.call(SLICING, key)) SLICING[key] = []
    // 重复存在的丢掉
    const find = SLICING[key].find(
      item => `${item.reg}` == `${val.reg}` && item.str == val.str
    )
    if (find) return
    SLICING[key].push(val)
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
export const SLICING = new Slicing()
