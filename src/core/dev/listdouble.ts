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
    // 更新记录
    this.size++
    // 是否为空
    if (this.isEmpty()) {
      this.head = newNode
      this.tail = newNode
      this.middle = newNode
    } else {
      // 新节点的下一个记录为头部
      newNode.next = this.head
      // 头部的 前一个 记录为 新节点
      this.head.prev = newNode
      // 头部 重定向为  新节点
      this.head = newNode
      // 计算中间节点
      if (this.size % 2 === 1) {
        // 如果是单的,更新中间节点
        this.middle = this.middle.prev
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
    // 更新记录
    this.size++
    // 是否为空
    if (this.isEmpty()) {
      this.head = newNode
      this.tail = newNode
      this.middle = newNode
    } else {
      // 新节点的 前一个 记录为 尾部
      newNode.prev = this.tail
      // 尾部的下一个 记录为 新节点
      this.tail.next = newNode
      // 更新尾部节点
      this.tail = newNode
      if (this.size % 2 === 1) {
        this.middle = this.middle.next
      }
    }
  }

  /**
   * 移除指定
   * @param value
   */
  remove(value: T): void {
    // 记录头部
    let currentNode = this.head
    // 存在记录
    while (currentNode !== null) {
      // 搜索值
      if (currentNode.value === value) {
        // 恰巧是头部
        if (currentNode.prev === null) {
          // 重定位头部
          this.head = currentNode.next
        } else {
          currentNode.prev.next = currentNode.next
        }
        // 恰巧是尾部
        if (currentNode.next === null) {
          // 重定向尾部
          this.tail = currentNode.prev
        } else {
          currentNode.next.prev = currentNode.prev
        }

        // 缩减
        this.size--

        // 如果刚好是中间节点被移除
        if (this.middle.value == value) {
          this.middle = this.middle.prev
        } else {
          if (this.size % 2 === 1) {
            this.middle = this.middle.prev
          }
        }
        break
      }
      // 重新记录
      currentNode = currentNode.next
    }
  }

  /**
   * 根据索引删除
   * @param index
   */
  removeAt(index: number) {
    let currentNode = this.head

    let currentIndex = 0

    while (currentNode !== null) {
      if (currentIndex === index) {
        // 如果被移除的节点是头部节点
        if (currentNode.prev === null) {
          // 重新定位头部
          this.head = currentNode.next
        } else {
          currentNode.prev.next = currentNode.next
        }

        // 如果被移除的节点是尾部节点
        if (currentNode.next === null) {
          this.tail = currentNode.prev // 重新定位尾部
        } else {
          currentNode.next.prev = currentNode.prev
        }

        this.size-- // 缩减链表大小

        // 如果刚好是中间节点被移除
        if (this.middle.value == currentNode.value) {
          this.middle = this.middle.prev
        } else {
          if (this.size % 2 === 1) {
            this.middle = this.middle.prev
          }
        }
        return currentNode.value
      }

      currentNode = currentNode.next
      currentIndex++
    }
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
        // 更新中间节点
        if (this.size % 2 === 1) {
          this.middle = this.middle.prev
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

        if (this.size % 2 === 1) {
          this.middle = this.middle.prev // 更新中间节点
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
