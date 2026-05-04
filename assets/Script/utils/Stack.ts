/**
 * Stack - 栈（LIFO - Last In First Out）
 * 后进先出的线性数据结构
 * 
 * 使用场景：
 * - 撤销操作：记录操作历史，支持撤销/重做
 * - 深度优先搜索（DFS）：配合递归实现图遍历
 * - 表达式求值：中缀表达式转后缀、计算
 * - 函数调用栈：保存函数调用状态
 * - 回合制游戏：记录回合历史、支持悔棋
 * 
 * 特点：
 * - 只能在栈顶添加/删除元素
 * - 后入的元素先出
 * - 适合需要回溯的场景
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

export class Stack<T> {
    private top: Node<T> | null;
    private size: number;
    private nodePool: ObjectPool<Node<T>>;

    constructor() {
        this.top = null;
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
     * 压栈 - 将元素添加到栈顶
     * @param item 要添加的元素
     * 
     * 使用场景：记录操作、添加待处理任务
     */
    push(item: T): void {
        const node = this.nodePool.get();
        node.value = item;
        node.next = this.top;
        this.top = node;
        this.size++;
    }

    /**
     * 弹栈 - 取出栈顶元素（会删除）
     * @returns 栈顶元素，如果栈为空返回 undefined
     * 
     * 使用场景：取出最后添加的操作、撤销
     */
    pop(): T | undefined {
        if (this.isEmpty()) {
            return undefined;
        }
        const node = this.top!;
        this.top = node.next;
        const value = node.value;
        this.nodePool.put(node);
        this.size--;
        return value;
    }

    /**
     * 查看栈顶元素（不删除）
     * @returns 栈顶元素，如果栈为空返回 undefined
     * 
     * 使用场景：预览最后一步操作，但不执行撤销
     */
    peek(): T | undefined {
        if (this.isEmpty()) {
            return undefined;
        }
        return this.top!.value;
    }

    /**
     * 查看栈顶元素（与 peek 等价）
     * @returns 栈顶元素
     */
    getTop(): T | undefined {
        return this.peek();
    }

    /**
     * 栈是否为空
     * @returns 是否为空
     * 
     * 使用场景：判断是否可以撤销
     */
    isEmpty(): boolean {
        return this.size === 0;
    }

    /**
     * 栈长度
     * @returns 元素数量
     * 
     * 使用场景：查看可撤销的步数
     */
    sizeNum(): number {
        return this.size;
    }

    /**
     * 清空栈
     * 
     * 使用场景：清除历史、重置状态
     */
    clear(): void {
        let current = this.top;
        while (current !== null) {
            const next = current.next;
            this.nodePool.put(current);
            current = next;
        }
        this.top = null;
        this.size = 0;
    }

    /**
     * 转为数组（从栈顶到栈底）
     * @returns 数组形式
     * 
     * 使用场景：批量处理、调试输出
     */
    toArray(): T[] {
        const result: T[] = [];
        let current = this.top;
        while (current !== null) {
            result.push(current.value);
            current = current.next;
        }
        return result;
    }

    /**
     * 遍历栈（从栈顶到栈底）
     * @param callback 回调函数 (item, index) => void
     * 
     * 使用场景：查看所有可撤销操作
     */
    forEach(callback: (item: T, index: number) => void): void {
        let index = 0;
        let current = this.top;
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
     */
    find(predicate: (item: T) => boolean): T | undefined {
        let current = this.top;
        while (current !== null) {
            if (predicate(current.value)) {
                return current.value;
            }
            current = current.next;
        }
        return undefined;
    }

    /**
     * 查找第一个满足条件的元素索引（从栈顶算起）
     * @param predicate 条件函数
     * @returns 索引，未找到返回 -1
     */
    findIndex(predicate: (item: T) => boolean): number {
        let index = 0;
        let current = this.top;
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
     */
    contains(item: T): boolean {
        return this.find((x) => x === item) !== undefined;
    }

    /**
     * 转为字符串（调试用）
     * @returns 字符串形式
     */
    toString(): string {
        return `Stack [${this.toArray().join(', ')}]`;
    }

    /**
     * 复制栈
     * @returns 新的 Stack 实例
     * 
     * 使用场景：备份状态、快照
     */
    clone(): Stack<T> {
        const newStack = new Stack<T>();
        // 需要逆序复制，保持相同顺序
        const arr = this.toArray();
        for (let i = arr.length - 1; i >= 0; i--) {
            newStack.push(arr[i]);
        }
        return newStack;
    }

    /**
     * 获取多个栈顶元素（不删除）
     * @param count 要获取的数量
     * @returns 元素数组（从栈顶开始）
     * 
     * 使用场景：预览最后几步操作
     */
    peekMultiple(count: number): T[] {
        const result: T[] = [];
        let current = this.top;
        let i = 0;
        while (current !== null && i < count) {
            result.push(current.value);
            current = current.next;
            i++;
        }
        return result;
    }

    /**
     * 弹出多个元素
     * @param count 要弹出的数量
     * @returns 元素数组（从栈顶开始）
     * 
     * 使用场景：批量撤销操作
     */
    popMultiple(count: number): T[] {
        const result: T[] = [];
        for (let i = 0; i < count; i++) {
            const item = this.pop();
            if (item === undefined) break;
            result.push(item);
        }
        return result;
    }
}

export default Stack;