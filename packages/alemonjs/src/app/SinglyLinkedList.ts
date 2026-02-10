class ListNode<T> {
  data: T; // 节点数据
  next: ListNode<T> | null; // 指向下一个节点的指针

  constructor(data: T) {
    this.data = data;
    this.next = null;
  }
}

export class SinglyLinkedList<T> {
  private head: ListNode<T> | null; // 链表的头节点
  private tail: ListNode<T> | null; // 链表的尾节点，用于 O(1) append
  private size: number; // 链表的大小
  private current: ListNode<T> | null; // 当前节点指针

  constructor(initialValues?: T[]) {
    this.head = null;
    this.tail = null;
    this.size = 0;
    this.current = null; // 初始化当前节点为 null

    if (initialValues) {
      initialValues.forEach(value => this.append(value)); // 初始化链表
    }
  }

  // 在链表末尾添加新节点 - O(1)
  append(data: T): void {
    const newNode = new ListNode(data);

    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this.size++;
  }

  // 获取下一个节点并移动指针
  popNext(): ListNode<T> | null {
    if (!this.current) {
      this.current = this.head; // 如果当前节点为 null，从头节点开始
    } else {
      this.current = this.current.next; // 移动到下一个节点
    }

    return this.current; // 返回当前节点
  }

  // 删除当前节点
  removeCurrent(): void {
    if (!this.head || !this.current) {
      return;
    }

    if (this.current === this.head) {
      this.head = this.head.next; // 移除头节点
      if (!this.head) {
        this.tail = null; // 链表变空，重置 tail
      }
      this.current = null; // 重置当前节点
      this.size--;

      return;
    }

    let previous: ListNode<T> | null = this.head;

    while (previous && previous.next !== this.current) {
      previous = previous.next;
    }

    if (previous && this.current) {
      previous.next = this.current.next; // 跳过当前节点
      // 如果删除的是尾节点，更新 tail
      if (this.current === this.tail) {
        this.tail = previous;
      }
      this.current = null; // 重置当前节点
      this.size--;
    }
  }

  // 获取链表的大小
  getSize(): number {
    return this.size;
  }
}
