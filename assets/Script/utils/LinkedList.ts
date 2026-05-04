/**
 * LinkedList - 双向链表
 * 支持从任意位置高效插入/删除的线性数据结构
 * 
 * 使用场景：
 * - 需要频繁中间插入/删除的数据
 * - 游戏对象管理：管理活跃/非活跃对象
 * - LRU 缓存：最近最少使用算法
 * - 事件监听器列表：动态添加/移除监听
 * - 音乐播放列表：顺序播放、随机播放、歌曲管理
 * 
 * 特点：
 * - 插入/删除 O(1)（无需移动元素）
 * - 查询 O(n)
 * - 占用内存比数组大（每个节点额外存储前后指针）
 * - 使用对象池优化，减少 GC 压力
 */

import ObjectPool from './ObjectPool';

// 节点类（内部使用）
class Node<T> {
    value: T;
    prev: Node<T> | null;
    next: Node<T> | null;

    constructor(value: T) {
        this.value = value;
        this.prev = null;
        this.next = null;
    }
}

/**
 * 链表迭代器
 * 用于 for...of 遍历和逐个访问
 */
class LinkedListIterator<T> {
    private current: Node<T> | null;

    constructor(head: Node<T> | null) {
        this.current = head;
    }

    /**
     * 获取下一个元素
     * @returns { value: T, done: boolean }
     * 
     * 使用场景：手动控制遍历、惰性取值
     */
    next(): { value: T; done: boolean } {
        if (this.current === null) {
            return { value: null as any, done: true };
        }
        const value = this.current.value;
        this.current = this.current.next;
        return { value, done: false };
    }

    /**
     * 支持 for...of 循环
     */
    [Symbol.iterator](): IterableIterator<T> {
        return this;
    }
}

export class LinkedList<T> {
    private head: Node<T> | null;
    private tail: Node<T> | null;
    private size: number;
    private nodePool: ObjectPool<Node<T>>;

    constructor() {
        this.head = null;
        this.tail = null;
        this.size = 0;
        this.nodePool = new ObjectPool<Node<T>>(
            () => new Node(null as any),
            (node) => {
                node.value = null as any;
                node.prev = null;
                node.next = null;
            }
        );
    }

    /**
     * 尾部添加元素
     * @param item 要添加的元素
     * 
     * 使用场景：追加数据、构建列表
     */
    append(item: T): void {
        const node = this.nodePool.get();
        node.value = item;
        if (this.isEmpty()) {
            this.head = node;
            this.tail = node;
        } else {
            node.prev = this.tail;
            this.tail!.next = node;
            this.tail = node;
        }
        this.size++;
    }

    /**
     * 头部添加元素
     * @param item 要添加的元素
     * 
     * 使用场景：优先级高的数据插入、栈/队列转换
     */
    prepend(item: T): void {
        const node = this.nodePool.get();
        node.value = item;
        if (this.isEmpty()) {
            this.head = node;
            this.tail = node;
        } else {
            node.next = this.head;
            this.head!.prev = node;
            this.head = node;
        }
        this.size++;
    }

    /**
     * 指定位置插入元素
     * @param index 位置索引（0 到 size 之间）
     * @param item 要插入的元素
     * @returns 是否插入成功
     * 
     * 使用场景：中间插入、优先级排序
     */
    insertAt(index: number, item: T): boolean {
        if (index < 0 || index > this.size) {
            cc.warn(`[LinkedList] insertAt: 索引越界 ${index}`);
            return false;
        }
        if (index === 0) {
            this.prepend(item);
            return true;
        }
        if (index === this.size) {
            this.append(item);
            return true;
        }
        const node = this.nodePool.get();
        node.value = item;
        const target = this.getNode(index)!;
        node.prev = target.prev;
        node.next = target;
        target.prev!.next = node;
        target.prev = node;
        this.size++;
        return true;
    }

    /**
     * 删除第一个匹配的元素
     * @param item 要删除的元素
     * @returns 是否删除成功
     * 
     * 使用场景：移除特定对象、取消事件监听
     */
    remove(item: T): boolean {
        const node = this.findNode(item);
        if (node === null) {
            return false;
        }
        this.removeNode(node);
        return true;
    }

    /**
     * 删除指定位置的元素
     * @param index 位置索引
     * @returns 删除的元素，未找到返回 undefined
     * 
     * 使用场景：按位置删除、移除第 N 个元素
     */
    removeAt(index: number): T | undefined {
        const node = this.getNode(index);
        if (node === null) {
            return undefined;
        }
        const value = node.value;
        this.removeNode(node);
        return value;
    }

    /**
     * 获取指定位置的元素
     * @param index 位置索引
     * @returns 元素，未找到返回 undefined
     * 
     * 使用场景：按索引访问、随机访问
     */
    get(index: number): T | undefined {
        const node = this.getNode(index);
        return node ? node.value : undefined;
    }

    /**
     * 查找第一个匹配的元素索引
     * @param item 要查找的元素
     * @returns 索引，未找到返回 -1
     * 
     * 使用场景：查找元素位置、定位监听器
     */
    find(item: T): number {
        let index = 0;
        let current = this.head;
        while (current !== null) {
            if (current.value === item) {
                return index;
            }
            current = current.next;
            index++;
        }
        return -1;
    }

    /**
     * 判断是否包含某元素
     * @param item 要查找的元素
     * @returns 是否包含
     * 
     * 使用场景：检查对象是否存在
     */
    contains(item: T): boolean {
        return this.find(item) !== -1;
    }

    /**
     * 获取链表长度
     * @returns 元素数量
     */
    size(): number {
        return this.size;
    }

    /**
     * 判断链表是否为空
     * @returns 是否为空
     */
    isEmpty(): boolean {
        return this.size === 0;
    }

    /**
     * 清空链表
     * 
     * 使用场景：重置数据、释放内存
     */
    clear(): void {
        let current = this.head;
        while (current !== null) {
            const next = current.next;
            this.nodePool.put(current);
            current = next;
        }
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    /**
     * 转为数组
     * @returns 数组形式（从头到尾）
     * 
     * 使用场景：批量处理、调试
     */
    toArray(): T[] {
        const result: T[] = [];
        let current = this.head;
        while (current !== null) {
            result.push(current.value);
            current = current.next;
        }
        return result;
    }

    /**
     * 遍历链表
     * @param callback 回调函数 (item, index) => void
     * 
     * 使用场景：批量操作、过滤、映射
     */
    forEach(callback: (item: T, index: number) => void): void {
        let index = 0;
        let current = this.head;
        while (current !== null) {
            callback(current.value, index);
            current = current.next;
            index++;
        }
    }

    /**
     * 映射
     * @param transform 转换函数
     * @returns 转换后的新数组
     * 
     * 使用场景：数据转换、提取字段
     */
    map<U>(transform: (item: T, index: number) => U): U[] {
        const result: U[] = [];
        let index = 0;
        let current = this.head;
        while (current !== null) {
            result.push(transform(current.value, index));
            current = current.next;
            index++;
        }
        return result;
    }

    /**
     * 过滤
     * @param predicate 条件函数
     * @returns 满足条件的新数组
     * 
     * 使用场景：筛选特定元素
     */
    filter(predicate: (item: T, index: number) => boolean): T[] {
        const result: T[] = [];
        let index = 0;
        let current = this.head;
        while (current !== null) {
            if (predicate(current.value, index)) {
                result.push(current.value);
            }
            current = current.next;
            index++;
        }
        return result;
    }

    /**
     * 获取头元素
     * @returns 头元素，未找到返回 undefined
     */
    getFirst(): T | undefined {
        return this.head ? this.head.value : undefined;
    }

    /**
     * 获取尾元素
     * @returns 尾元素，未找到返回 undefined
     */
    getLast(): T | undefined {
        return this.tail ? this.tail.value : undefined;
    }

    /**
     * 获取第一个节点（内部使用）
     */
    private getNode(index: number): Node<T> | null {
        if (index < 0 || index >= this.size) {
            return null;
        }
        if (index < this.size / 2) {
            let current = this.head;
            for (let i = 0; i < index; i++) {
                current = current!.next;
            }
            return current;
        } else {
            let current = this.tail;
            for (let i = this.size - 1; i > index; i--) {
                current = current!.prev;
            }
            return current;
        }
    }

    /**
     * 查找节点（内部使用）
     */
    private findNode(item: T): Node<T> | null {
        let current = this.head;
        while (current !== null) {
            if (current.value === item) {
                return current;
            }
            current = current.next;
        }
        return null;
    }

    /**
     * 删除节点（内部使用）
     */
    private removeNode(node: Node<T>): void {
        if (node.prev !== null) {
            node.prev.next = node.next;
        } else {
            this.head = node.next;
        }
        if (node.next !== null) {
            node.next.prev = node.prev;
        } else {
            this.tail = node.prev;
        }
        this.nodePool.put(node);
        this.size--;
    }

    /**
     * 支持 for...of 循环
     * @returns 迭代器
     * 
     * 使用场景：
     * - for (const item of list) 遍历
     * - [...list] 展开运算符
     */
    [Symbol.iterator](): IterableIterator<T> {
        return new LinkedListIterator(this.head);
    }

    /**
     * 返回迭代器对象
     * @returns 迭代器
     * 
     * 使用场景：手动控制遍历、惰性取值
     */
    iterator(): LinkedListIterator<T> {
        return new LinkedListIterator(this.head);
    }

    /**
     * 转为字符串（调试用）
     * @returns 字符串形式
     */
    toString(): string {
        return `LinkedList [${this.toArray().join(', ')}]`;
    }

    /**
     * 反转链表
     * @returns 反转后的新链表（不修改原链表）
     * 
     * 使用场景：反向遍历、需要倒序数据
     */
    reverse(): LinkedList<T> {
        const newList = new LinkedList<T>();
        let current = this.tail;
        while (current !== null) {
            newList.append(current.value);
            current = current.prev;
        }
        return newList;
    }

    /**
     * 合并另一个链表
     * @param other 另一个链表
     * 
     * 使用场景：链表拼接、列表合并
     */
    concat(other: LinkedList<T>): void {
        other.forEach((item) => this.append(item));
    }
}

export default LinkedList;