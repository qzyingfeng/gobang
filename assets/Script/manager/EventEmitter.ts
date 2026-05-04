/**
 * EventEmitter - 事件派发系统
 * 基于观察者模式的事件管理系统
 * 用于游戏组件间的松耦合通信
 * 
 * 使用方式：
 * - EventEmitter.getInstance().on('eventName', callback)
 * - EventEmitter.getInstance().emit('eventName', data)
 */

class EventEmitterClass {
    /** 单例实例 */
    private static _instance: EventEmitterClass | null = null;
    /** 事件处理器映射表 */
    private handlers: { [event: string]: any[] } = {};
    /** 事件池（复用 EventHandler 对象） */
    private handlerPool: any[] = [];
    /** 事件池容量 */
    private POOL_SIZE = 20;

    private constructor() {}

    /**
     * 获取单例实例
     */
    static getInstance(): EventEmitterClass {
        if (!this._instance) {
            this._instance = new EventEmitterClass();
        }
        return this._instance;
    }

    /**
     * 从事件池获取 EventHandler 对象
     */
    private acquireHandler(): any {
        if (this.handlerPool.length > 0) {
            return this.handlerPool.pop();
        }
        return {
            callback: null,
            context: null,
            priority: 0,
            once: false
        };
    }

    /**
     * 回收 EventHandler 到事件池
     */
    private releaseHandler(handler: any): void {
        if (this.handlerPool.length < this.POOL_SIZE) {
            handler.callback = null;
            handler.context = null;
            handler.priority = 0;
            handler.once = false;
            this.handlerPool.push(handler);
        }
    }

    /**
     * 注册事件监听
     * @param event 事件名称
     * @param callback 回调函数
     * @param context 上下文（用于精确移除）
     * @param priority 优先级（数值越大越先执行，默认 0）
     */
    on(event: string, callback: Function, context?: any, priority: number = 0): void {
        if (!event || !callback) {
            cc.warn('EventEmitter: 参数无效 event=' + event + ', callback=' + callback);
            return;
        }

        if (!this.handlers[event]) {
            this.handlers[event] = [];
        }

        const handler = this.acquireHandler();
        handler.callback = callback;
        handler.context = context || null;
        handler.priority = priority;
        handler.once = false;

        this.handlers[event].push(handler);

        this.handlers[event].sort((a: any, b: any) => b.priority - a.priority);
    }

    /**
     * 注册一次性事件监听（触发后自动移除）
     * @param event 事件名称
     * @param callback 回调函数
     * @param context 上下文
     */
    once(event: string, callback: Function, context?: any): void {
        if (!event || !callback) {
            cc.warn('EventEmitter: 参数无效 event=' + event + ', callback=' + callback);
            return;
        }

        if (!this.handlers[event]) {
            this.handlers[event] = [];
        }

        const handler = this.acquireHandler();
        handler.callback = callback;
        handler.context = context || null;
        handler.priority = 0;
        handler.once = true;

        this.handlers[event].push(handler);
    }

    /**
     * 移除事件监听
     * @param event 事件名称
     * @param callback 回调函数（可选，不传则移除该事件所有监听）
     * @param context 上下文（可选，用于精确移除）
     */
    off(event: string, callback?: Function, context?: any): void {
        if (!event) {
            return;
        }

        const handlers = this.handlers[event];
        if (!handlers || handlers.length === 0) {
            return;
        }

        if (!callback) {
            for (let i = 0; i < handlers.length; i++) {
                this.releaseHandler(handlers[i]);
            }
            delete this.handlers[event];
            return;
        }

        for (let i = handlers.length - 1; i >= 0; i--) {
            const handler = handlers[i];
            const callbackMatch = handler.callback === callback;
            const contextMatch = !context || handler.context === context;

            if (callbackMatch && contextMatch) {
                this.releaseHandler(handler);
                handlers.splice(i, 1);
            }
        }

        if (handlers.length === 0) {
            delete this.handlers[event];
        }
    }

    /**
     * 移除指定上下文的所有事件监听
     * 用于组件销毁时清理，避免内存泄漏
     * @param context 上下文对象
     */
    offAll(context: any): void {
        if (!context) {
            return;
        }

        for (const event in this.handlers) {
            const handlers = this.handlers[event];
            for (let i = handlers.length - 1; i >= 0; i--) {
                if (handlers[i].context === context) {
                    this.releaseHandler(handlers[i]);
                    handlers.splice(i, 1);
                }
            }

            if (handlers.length === 0) {
                delete this.handlers[event];
            }
        }
    }

    /**
     * 触发事件
     * @param event 事件名称
     * @param args 传递给回调的参数
     */
    emit(event: string, ...args: any[]): void {
        const handlers = this.handlers[event];
        if (!handlers || handlers.length === 0) {
            return;
        }

        const toRemove: any[] = [];

        for (let i = 0; i < handlers.length; i++) {
            const handler = handlers[i];
            try {
                handler.callback.apply(handler.context, args);
            } catch (e) {
                cc.error('EventEmitter: 事件 ' + event + ' 回调执行出错', e);
            }

            if (handler.once) {
                toRemove.push(handler);
            }
        }

        for (let i = 0; i < toRemove.length; i++) {
            this.off(event, toRemove[i].callback, toRemove[i].context);
        }
    }

    /**
     * 异步触发事件（返回 Promise 数组）
     * @param event 事件名称
     * @param args 传递给回调的参数
     */
    async emitAsync(event: string, ...args: any[]): Promise<any[]> {
        const handlers = this.handlers[event];
        if (!handlers || handlers.length === 0) {
            return [];
        }

        const promises: Promise<any>[] = [];
        const toRemove: any[] = [];

        for (let i = 0; i < handlers.length; i++) {
            const handler = handlers[i];
            try {
                const result = handler.callback.apply(handler.context, args);
                if (result instanceof Promise) {
                    promises.push(result);
                }
            } catch (e) {
                cc.error('EventEmitter: 事件 ' + event + ' 异步回调执行出错', e);
            }

            if (handler.once) {
                toRemove.push(handler);
            }
        }

        for (let i = 0; i < toRemove.length; i++) {
            this.off(event, toRemove[i].callback, toRemove[i].context);
        }

        return Promise.all(promises);
    }

    /**
     * 检查是否存在指定事件监听
     * @param event 事件名称
     */
    hasListener(event: string): boolean {
        const handlers = this.handlers[event];
        return !!(handlers && handlers.length > 0);
    }

    /**
     * 获取指定事件的监听器数量
     * @param event 事件名称
     */
    getListenerCount(event: string): number {
        const handlers = this.handlers[event];
        return handlers ? handlers.length : 0;
    }

    /**
     * 清空所有事件监听（用于场景切换）
     */
    clearAll(): void {
        for (const event in this.handlers) {
            const handlers = this.handlers[event];
            for (let i = 0; i < handlers.length; i++) {
                this.releaseHandler(handlers[i]);
            }
        }
        this.handlers = {};
        cc.log('EventEmitter: 已清空所有事件监听');
    }

    /**
     * 清空指定事件的所有监听
     * @param event 事件名称
     */
    clearEvent(event: string): void {
        const handlers = this.handlers[event];
        if (handlers) {
            for (let i = 0; i < handlers.length; i++) {
                this.releaseHandler(handlers[i]);
            }
            delete this.handlers[event];
        }
    }
}

export default EventEmitterClass;