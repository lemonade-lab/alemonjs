class ListNode<T> {
  data: T;
  next: ListNode<T> | null;

  constructor(data: T) {
    this.data = data;
    this.next = null;
  }
}

export class SinglyLinkedList<T> {
  private head: ListNode<T> | null;
  private tail: ListNode<T> | null;
  private size: number;
  private current: ListNode<T> | null;

  constructor(initialValues?: T[]) {
    this.head = null;
    this.tail = null;
    this.size = 0;
    this.current = null;

    if (initialValues) {
      initialValues.forEach(value => this.append(value));
    }
  }

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

  popNext(): ListNode<T> | null {
    if (!this.current) {
      this.current = this.head;
    } else {
      this.current = this.current.next;
    }

    return this.current;
  }

  removeCurrent(): void {
    if (!this.head || !this.current) {
      return;
    }

    if (this.current === this.head) {
      this.head = this.head.next;
      if (!this.head) {
        this.tail = null;
      }
      this.current = null;
      this.size--;

      return;
    }

    let previous: ListNode<T> | null = this.head;

    while (previous && previous.next !== this.current) {
      previous = previous.next;
    }

    if (previous && this.current) {
      previous.next = this.current.next;
      if (this.current === this.tail) {
        this.tail = previous;
      }
      this.current = previous;
      this.size--;
    }
  }

  getSize(): number {
    return this.size;
  }

  resetCursor(): void {
    this.current = null;
  }

  forEach(callback: (node: ListNode<T>) => boolean | undefined): void {
    let node = this.head;

    while (node) {
      if (callback(node) === true) {
        break;
      }
      node = node.next;
    }
  }
}
