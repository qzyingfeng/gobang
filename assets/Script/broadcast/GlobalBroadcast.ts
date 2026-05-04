/**
 * GlobalBroadcast - 全局广播中心
 * 按方法名注册组件，支持按页面/弹窗分类广播
 */

export class GlobalBroadcast {
    /** 按方法名 -> { pages: Set<cc.Component>, popups: Set<cc.Component> } */
    private static registry = new Map<string, {
        pages: Set<cc.Component>;
        popups: Set<cc.Component>;
    }>();

    /** 全局调试监听器 */
    static onBroadcast: ((methodName: string, payload: any, targets: cc.Component[]) => void) | undefined;

    /** 黑名单：永远不收集的生命周期方法 */
    private static blacklist = new Set([
        'onLoad', 'start', 'update', 'lateUpdate', 'onDestroy',
        'onEnable', 'onDisable', '__preload', 'onRestore',
        'onFocusInEditor', 'onLostFocusInEditor'
    ]);

    /** 收集组件上所有 @Broadcast 装饰的方法名 */
    private static collectMethods(comp: cc.Component): string[] {
        var proto = Object.getPrototypeOf(comp);
        var ctor = proto.constructor;
        return (ctor.__broadcastMethods as string[]) || [];
    }

    /** 注册组件（由 BaseUI.onEnable 调用） */
    static register(comp: cc.Component, type: string): void {
        var methods = this.collectMethods(comp);
        for (var i = 0; i < methods.length; i++) {
            var method = methods[i];
            if (this.blacklist.has(method)) continue;
            var entry = this.registry.get(method);
            if (!entry) {
                entry = { pages: new Set(), popups: new Set() };
                this.registry.set(method, entry);
            }
            var targetSet = type === 'page' ? entry.pages : entry.popups;
            targetSet.add(comp);
        }
    }

    /** 注销组件（由 BaseUI.onDisable/onDestroy 调用） */
    static unregister(comp: cc.Component): void {
        if (!comp || !comp.node || !cc.isValid(comp.node)) return;
        this.registry.forEach(function(entry) {
            entry.pages.delete(comp);
            entry.popups.delete(comp);
        });
    }

    /** 在指定组件集合上调用方法 */
    private static invokeOnSet(
        methodName: string,
        payload: any,
        set: Set<cc.Component>,
        exclude?: cc.Component
    ): void {
        if (set.size === 0) return;
        var targets: cc.Component[] = [];
        set.forEach(function(comp) {
            if (comp === exclude || !cc.isValid(comp)) {
                set.delete(comp);
                return;
            }
            targets.push(comp);
        });
        for (var i = 0; i < targets.length; i++) {
            var comp = targets[i];
            var fn = (comp as any)[methodName];
            if (typeof fn === 'function') {
                try {
                    fn.call(comp, payload);
                } catch (e) {
                    cc.error('[GlobalBroadcast] ' + (comp.node ? comp.node.name : 'unknown') + '.' + methodName + ' 执行错误', e);
                }
            }
        }
        if (this.onBroadcast) {
            this.onBroadcast(methodName, payload, targets);
        }
    }

    /** 广播给所有页面+弹窗 */
    static broadcastAll(methodName: string, payload?: any, exclude?: cc.Component): void {
        var entry = this.registry.get(methodName);
        if (!entry) return;
        this.invokeOnSet(methodName, payload, entry.pages, exclude);
        this.invokeOnSet(methodName, payload, entry.popups, exclude);
    }

    /** 仅广播给页面 */
    static broadcastPages(methodName: string, payload?: any, exclude?: cc.Component): void {
        var entry = this.registry.get(methodName);
        if (!entry) return;
        this.invokeOnSet(methodName, payload, entry.pages, exclude);
    }

    /** 仅广播给弹窗 */
    static broadcastPopups(methodName: string, payload?: any, exclude?: cc.Component): void {
        var entry = this.registry.get(methodName);
        if (!entry) return;
        this.invokeOnSet(methodName, payload, entry.popups, exclude);
    }

    /** 调试：打印当前注册表 */
    static debugDump(): void {
        console.log('=== GlobalBroadcast Registry ===');
        this.registry.forEach(function(entry, method) {
            console.log('  [' + method + '] pages:' + entry.pages.size + ' popups:' + entry.popups.size);
        });
    }
}
