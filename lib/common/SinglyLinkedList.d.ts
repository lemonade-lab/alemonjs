//#region src/common/SinglyLinkedList.d.ts
declare class ListNode<T> {
  data: T;
  next: ListNode<T> | null;
  constructor(data: T);
}
declare class SinglyLinkedList<T> {
  private head;
  private tail;
  private size;
  private current;
  constructor(initialValues?: T[]);
  append(data: T): void;
  popNext(): ListNode<T> | null;
  removeCurrent(): void;
  getSize(): number;
  resetCursor(): void;
  forEach(callback: (node: ListNode<T>) => boolean | undefined): void;
}
//#endregion
export { SinglyLinkedList };