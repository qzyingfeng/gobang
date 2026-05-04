/**
 * ObjectPool - 通用对象池
 * 用于栈、队列、链表等数据结构的节点复用
 * 减少频繁创建/销毁导致的 GC 压力
 */

class ObjectPool<T> {
    private pool: T[] = [];

    private createFn: () => T;

    private resetFn: (obj: T) => void;

    constructor(createFn: () => T, resetFn: (obj: T) => void) {
        this.createFn = createFn;
        this.resetFn = resetFn;
    }

    get(): T {
        if (this.pool.length > 0) {
            return this.pool.pop()!;
        }
        return this.createFn();
    }

    put(obj: T): void {
        this.resetFn(obj);
        this.pool.push(obj);
    }

    clear(): void {
        this.pool = [];
    }

    size(): number {
        return this.pool.length;
    }
}

export default ObjectPool;