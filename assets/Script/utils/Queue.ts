/**
 * Queue - 队列（FIFO - First In First Out）
 * 先进先出的线性数据结构
 * 
 * 使用场景：
 * - 消息队列：处理异步消息、按顺序执行任务
 * - 事件队列：存储待处理的事件、帧回调
 * - 回放记录：存储棋谱操作、动作历史
 * - 任务调度：按顺序执行任务、等待队列
 * 
 * 特点：
 * - 只能从队尾添加元素
 * - 只能从队首取出元素
 * - 适合按顺序处理数据
 * - 使用对象池优化，减少 GC 压力
 */

import ObjectPool from './ObjectPool';

// 节点类（内部使用）
class Node<T> {
    value: T;
    next: Node<T> | null;

    constructor(value: T) {
        this.value = value;
        this.next = null;
    }
}

export class Queue<T> {
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
                node.next = null;
            }
        );
    }

    /**
     * 入队 - 从队尾添加元素
     * @param item 要添加的元素
     * 
     * 使用场景：添加新任务、新消息、新操作
     */
    enqueue(item: T): void {
        const node = this.nodePool.get();
        node.value = item;
        if (this.isEmpty()) {
            this.head = node;
            this.tail = node;
        } else {
            this.tail!.next = node;
            this.tail = node;
        }
        this.size++;
    }

    /**
     * 出队 - 从队首取出元素（会删除）
     * @returns 队首元素，如果队列为空返回 undefined
     * 
     * 使用场景：取出下一个待处理的任务
     */
    dequeue(): T | undefined {
        if (this.isEmpty()) {
            return undefined;
        }
        const node = this.head!;
        this.head = node.next;
        if (this.head === null) {
            this.tail = null;
        }
        const value = node.value;
        this.nodePool.put(node);
        this.size--;
        return value;
    }

    /**
     * 查看队首元素（不删除）
     * @returns 队首元素，如果队列为空返回 undefined
     * 
     * 使用场景：预览下一个要处理的任务，但不取出
     */
    front(): T | undefined {
        if (this.isEmpty()) {
            return undefined;
        }
        return this.head!.value;
    }

    /**
     * 查看队尾元素（不删除）
     * @returns 队尾元素，如果队列为空返回 undefined
     * 
     * 使用场景：查看最后加入的元素
     */
    back(): T | undefined {
        if (this.isEmpty()) {
            return undefined;
        }
        return this.tail!.value;
    }

    /**
     * 查看队首元素（与 front 等价）
     * @returns 队首元素
     */
    peek(): T | undefined {
        return this.front();
    }

    /**
     * 队列是否为空
     * @returns 是否为空
     * 
     * 使用场景：判断是否还有待处理任务
     */
    isEmpty(): boolean {
        return this.size === 0;
    }

    /**
     * 队列长度
     * @returns 元素数量
     * 
     * 使用场景：查看队列积压情况
     */
    sizeNum(): number {
        return this.size;
    }

    /**
     * 清空队列
     * 
     * 使用场景：重置队列、清除所有待处理任务
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
     * @returns 数组形式（从队首到队尾）
     * 
     * 使用场景：批量处理、调试输出
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
     * 遍历队列（不改变队列内容）
     * @param callback 回调函数 (item, index) => void
     * 
     * 使用场景：批量检查所有元素、过滤
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
     * 查找第一个满足条件的元素
     * @param predicate 条件函数
     * @returns 找到的元素，未找到返回 undefined
     * 
     * 使用场景：查找特定任务、过滤
     */
    find(predicate: (item: T) => boolean): T | undefined {
        let current = this.head;
        while (current !== null) {
            if (predicate(current.value)) {
                return current.value;
            }
            current = current.next;
        }
        return undefined;
    }

    /**
     * 查找第一个满足条件的元素索引
     * @param predicate 条件函数
     * @returns 索引，未找到返回 -1
     */
    findIndex(predicate: (item: T) => boolean): number {
        let index = 0;
        let current = this.head;
        while (current !== null) {
            if (predicate(current.value)) {
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
     * 使用场景：检查任务是否存在
     */
    contains(item: T): boolean {
        return this.find((x) => x === item) !== undefined;
    }

    /**
     * 转为字符串（调试用）
     * @returns 字符串形式
     */
    toString(): string {
        return `Queue [${this.toArray().join(', ')}]`;
    }

    /**
     * 复制队列
     * @returns 新的 Queue 实例
     * 
     * 使用场景：备份队列状态
     */
    clone(): Queue<T> {
        const newQueue = new Queue<T>();
        this.forEach((item) => newQueue.enqueue(item));
        return newQueue;
    }
}

export default Queue;