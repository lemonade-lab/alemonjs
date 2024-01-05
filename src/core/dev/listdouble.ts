export class DoubleNode {
  prew: typeof DoubleNode.prototype = null
  next: typeof DoubleNode.prototype = null
  data = undefined
  constructor(data: any) {
    this.data = data
  }
}

export class DoubleList {
  #count = 0
  #head: typeof DoubleNode.prototype = null
  #tail: typeof DoubleNode.prototype = null

  getHead() {
    return this.#head
  }

  getTail() {
    return this.#tail
  }

  /**
   * 上链
   * @param val
   * @returns
   */
  push(val: any) {
    const node = new DoubleNode(val)
    this.#count++
    if (this.#head === null) {
      this.#head = node
      this.#tail = node
      return
    }
    // 尾部添加
    this.#tail.next = node
    // 标记node的头部
    node.prew = this.#tail
    // 重新标记位置
    this.#tail = node
    return
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
    // 先减
    this.#count--
    if (index === 0) {
      // 直接断掉第一个
      if (this.#count === 0) {
        this.#head = null
        this.#tail = null
        return
      } else {
        this.#head = this.#head.next
        // 断掉头部的引用
        this.#head.prew = null
        return
      }
    }
    if (index == this.#count + 1) {
      this.#tail = this.#tail.prew
      // 断掉尾部引用
      this.#tail.next = null
      return
    }
    const p = this.getNodeAt(index - 1)
    const c = p.prew
    // c.next 即可第三个位置
    p.next = c.next
    // 第三位置 指到 p
    c.next.prew = p
    return
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
    const node = new DoubleNode(data)
    this.#count++

    // 头部
    if (index == 0) {
      if (this.#head === null) {
        this.#head = node
        this.#tail = node
        return true
      }
      // 头部的上一个是node
      // 而node的下一个是 原来是head
      node.next = this.#head
      this.#head.prew = node
      // 重新标记head
      this.#head = node
      return true
    }

    // 尾部
    if (index == this.#count) {
      this.#tail.next = node
      node.prew = this.#tail
      // 更新
      this.#tail = node
      return true
    }
    const p = this.getNodeAt(index - 1)
    const c = p.next
    node.next = c
    c.prew = node
    p.next = node
    node.prew = p
    return true
  }

  size() {
    return this.#count
  }

  isEmpty() {
    return this.size() == 0
  }
}
