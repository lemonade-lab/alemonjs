export class ReStart {
  // 倍率
  p = 3
  constructor(val: number) {
    this.p = val
  }
  // 次数记录
  size = 1
  // 当前时间
  time = 10
  // 当前时间
  get() {
    return this.time
  }
  getSize() {
    return this.size
  }
  // 清空记录
  del() {
    this.size = 1
    this.time = 10
  }
  // 得到下一次时间
  next() {
    this.time *= this.p
    // 单位，秒
    return this.time * 1000
  }
}
