/**
 * 节点
 */
class Node<T> {
  public value: T
  public next: Node<T> | null = null
  public prev: Node<T> | null = null
  constructor(value: T) {
    this.value = value
  }
}

/**
 * 双向链表
 */
export class DoublyLinkedList<T> {
  // 头部
  private head: Node<T> | null = null
  // 尾部
  private tail: Node<T> | null = null
  // 中间节点
  private middle: Node<T> | null = null
  // 大小
  private size = 0

  /**
   * 得到尾部
   * @returns
   */
  getHead(): Node<T> | null {
    return this.head
  }

  /**
   * 得到尾部
   * @returns
   */
  getTail(): Node<T> | null {
    return this.tail
  }

  /**
   * 得到中间
   * @returns
   */
  getMiddle(): Node<T> | null {
    return this.middle
  }

  /**
   * 得到大小
   * @returns
   */
  getSize(): number {
    return this.size
  }

  /**
   * 是否为空
   * @returns
   */
  isEmpty(): boolean {
    return this.size === 0
  }

  /**
   * 头部插入
   * @param value
   */
  prepend(value: T): void {
    // 创建节点
    const newNode = new Node(value)
    // 是否为空
    if (this.isEmpty()) {
      // 更新记录
      this.size++
      this.head = newNode
      this.tail = newNode
      this.middle = this.head
    } else {
      // 更新记录
      this.size++
      // 新节点的下一个记录为头部
      newNode.next = this.head
      this.head!.prev = newNode
      // 头部 重定向为  新节点
      this.head = newNode
      // 计算中间节点

      if (this.size === 2) {
        this.middle = this.head
      } else if (this.size === 3) {
        this.middle = this.head.next
      } else {
        const size = Math.floor(this.size / 2) + (this.size % 2)
        let currentNode = this.head
        for (let i = 0; i < size; i++) {
          currentNode = currentNode.next
        }
      }
    }
  }

  /**
   * 尾部插入
   * @param value
   */
  append(value: T): void {
    // 建立节点
    const newNode = new Node(value)
    // 是否为空
    if (this.isEmpty()) {
      // 更新记录
      this.size++
      this.head = newNode
      this.tail = newNode
      this.middle = newNode
    } else {
      // 更新记录
      this.size++
      // 新节点的 前一个 记录为 尾部
      newNode.prev = this.tail
      this.tail!.prev = newNode

      // 更新尾部节点
      this.tail = newNode

      if (this.size == 2) {
        this.middle = this.head
      } else if (this.size == 3) {
        this.middle = this.head.next
      } else {
        const size = Math.floor(this.size / 2) + (this.size % 2)
        let currentNode = this.head
        for (let i = 0; i < size; i++) {
          currentNode = currentNode.next
        }
      }
    }
  }

  /**
   * 头部删除
   */
  shift() {
    // 缩减
    this.size--

    const c = this.head

    // 头部删
    this.head = this.head.next

    if (this.size == 2) {
      this.middle = this.head
    } else if (this.size == 3) {
      this.middle = this.head.next
    } else {
      const size = Math.floor(this.size / 2) + (this.size % 2)
      let currentNode = this.head
      for (let i = 0; i < size; i++) {
        currentNode = currentNode.next
      }
    }
    return c.value
  }

  /**
   * 尾部删除
   */
  pop() {
    // 缩减
    this.size--

    const c = this.tail

    // 头部删
    this.tail = this.tail.prev

    if (this.size == 2) {
      this.middle = this.head
    } else if (this.size == 3) {
      this.middle = this.head.next
    } else {
      const size = Math.floor(this.size / 2) + (this.size % 2)
      let currentNode = this.head
      for (let i = 0; i < size; i++) {
        currentNode = currentNode.next
      }
    }

    return c.value
  }

  /**
   * 头部遍历
   * @param condition
   * @param value
   * @returns
   */
  traverseAndInsert(condition: (val: T) => boolean, value: T): boolean {
    // 记录尾部
    let current = this.head
    let prev = null

    while (current) {
      // 如果条件满足
      if (condition(current.value)) {
        // 创建节点
        const newNode = new Node(value)
        // 记录下一个
        newNode.next = current
        // 记录前一个
        newNode.prev = prev
        // 恰巧是头部
        if (prev == null) {
          this.head = newNode
        } else {
          prev.next = newNode
        }
        current.prev = newNode
        // 更新
        this.size++

        // 计算中间节点
        if (this.size == 2) {
          this.middle = this.head
        } else if (this.size == 3) {
          this.middle = this.head.next
        } else {
          const size = Math.floor(this.size / 2) + (this.size % 2)
          let currentNode = this.head
          for (let i = 0; i < size; i++) {
            currentNode = currentNode.next
          }
        }
        return true
      }
      // 移动
      prev = current
      current = current.next
    }
    return false
  }

  /**
   * 尾部遍历
   * @param condition
   * @param value
   * @returns
   */
  traverseAndInsertTail(condition: (val: T) => boolean, value: T): boolean {
    let current = this.tail // 从尾部开始向前遍历
    let prev = null

    while (current) {
      if (condition(current.value)) {
        const newNode = new Node(value)
        newNode.next = current.next
        newNode.prev = current

        if (current.next !== null) {
          current.next.prev = newNode
        } else {
          // 如果插入的位置是尾部之后，则更新尾部为新节点
          this.tail = newNode
        }

        if (prev === null) {
          // 如果插入的位置是头部之前，则更新头部为新节点
          this.head = newNode
        } else {
          prev.next = newNode
        }

        this.size++

        // 计算中间节点
        if (this.size == 2) {
          this.middle = this.head
        } else if (this.size == 3) {
          // 走到中间
          this.middle = this.head.next
        } else {
          const size = Math.floor(this.size / 2) + (this.size % 2)
          let currentNode = this.head
          for (let i = 0; i < size; i++) {
            currentNode = currentNode.next
          }
        }
        return true
      }

      prev = current
      current = current.prev // 向前移动
    }

    return false
  }

  /**
   * 转换为数组
   * @returns
   */
  toArray(): T[] {
    const array: T[] = []
    let currentNode = this.head
    while (currentNode !== null) {
      array.push(currentNode.value)
      currentNode = currentNode.next
    }
    return array
  }
}
