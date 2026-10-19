//#region src/common/SinglyLinkedList.ts
var ListNode = class {
	data;
	next;
	constructor(data) {
		this.data = data;
		this.next = null;
	}
};
var SinglyLinkedList = class {
	head;
	tail;
	size;
	current;
	constructor(initialValues) {
		this.head = null;
		this.tail = null;
		this.size = 0;
		this.current = null;
		if (initialValues) initialValues.forEach((value) => this.append(value));
	}
	append(data) {
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
	popNext() {
		if (!this.current) this.current = this.head;
		else this.current = this.current.next;
		return this.current;
	}
	removeCurrent() {
		if (!this.head || !this.current) return;
		if (this.current === this.head) {
			this.head = this.head.next;
			if (!this.head) this.tail = null;
			this.current = null;
			this.size--;
			return;
		}
		let previous = this.head;
		while (previous && previous.next !== this.current) previous = previous.next;
		if (previous && this.current) {
			previous.next = this.current.next;
			if (this.current === this.tail) this.tail = previous;
			this.current = previous;
			this.size--;
		}
	}
	getSize() {
		return this.size;
	}
	resetCursor() {
		this.current = null;
	}
	forEach(callback) {
		let node = this.head;
		while (node) {
			if (callback(node) === true) break;
			node = node.next;
		}
	}
};

//#endregion
export { SinglyLinkedList };