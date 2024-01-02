export class Node {
  next: typeof Node.prototype = null
  data = undefined
  constructor(data: any) {
    this.data = data
  }
}

export class List {
  #count = 0
  #head: typeof Node.prototype = null

  getHead() {
    return this.#head
  }

  /**
   * 上链
   * @param val
   * @returns
   */
  push(val: any) {
    console.log('val', val)
    const node = new Node(val)
    this.#count++
    if (this.#head === null) {
      this.#head = node
      return
    }
    // 记录指针位置
    let p = this.#head
    while (p.next !== null) {
      // 从头走到尾巴
      p = p.next
    }
    p.next = node
  }

  /**
   * 校验
   * @param index
   * @returns
   */
  v(index: number) {
    return index < 0 || index >= this.#count
  }

  // 从0开始
  // data，next - data，next - data,next

  /**
   * 得到节点
   * @param index
   * @returns
   */
  getNodeAt(index: number) {
    console.log('')
    if (this.v(index)) return undefined
    // 位置
    let p = this.#head
    for (let i = 0; i < index; i++) {
      // 移动
      p = p.next
    }
    return p
  }

  /**
   * 删除指定位置
   * @param index
   * @returns
   */
  removeAt(index: number) {
    if (this.v(index)) return undefined
    this.#count--
    if (index === 0) {
      // 直接断掉第一个
      const val = this.#head
      this.#head = this.#head.next
      return val.data
    }
    // 前一个数据
    const previous: typeof Node.prototype = this.getNodeAt(index - 1)
    // 位置
    const p = previous.next
    // 断掉
    previous.next = p.next
    return p.data
  }

  /**
   * 对比data
   * @param a
   * @param b
   * @returns
   */
  eq(a: any, b: any) {
    // 不相等
    if (b !== a) {
      // 对象结构缺失
      return JSON.stringify(a) === JSON.stringify(b)
    }
    return true
  }

  /**
   * 索引
   * @param val
   * @returns
   */
  indexOf(val: any): number {
    let p = this.#head
    for (let i = 0; i < this.#count; i++) {
      // 判断？
      if (this.eq(p.data, val)) return i
      // 移动
      p = p.next
    }
    return -1
  }

  /**
   * 删除指定值
   * @param val
   * @returns
   */
  remove(val: any) {
    return this.removeAt(this.indexOf(val))
  }

  // 从0开始
  // data，next - data，next - data,next

  /**
   * 指定位置插入
   * @param data
   * @param index
   */
  insert(data: any, index: any) {
    if (index < 0 || index > this.#count) {
      return false
    }
    const node = new Node(data)
    this.#count++
    if (index == 0) {
      const current = this.#head
      node.next = current
      this.#head = node
      return false
    }
    // 前一个节点
    const c = this.getNodeAt(index - 1)
    const p = c.next
    node.next = p
    c.next = node
    return true
  }

  size() {
    return this.#count
  }

  isEmpty() {
    return this.size() == 0
  }
}
