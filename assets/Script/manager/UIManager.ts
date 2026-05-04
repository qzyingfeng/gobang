/**
 * UIManager - 界面管理器
 * 
 * 修复：scheduleOnce 的 target 使用节点本身，节点销毁时自动取消回调
 */
import ResourceManager from './ResourceManager';

interface PanelConfig {
    path: string;
    [key: string]: any;
}

interface PanelInfo {
    node: cc.Node;
    script: any;
    config: PanelConfig;
}

class UIManagerClass {
    private static _instance: UIManagerClass;

    private configMap: Record<string, PanelConfig> = {};
    private prefabCache: Record<string, cc.Prefab> = {};
    private panelMap: Record<string, PanelInfo> = {};
    private currentPanel: string | null = null;
    private panelStack: string[] = [];
    private viewLayer: cc.Node | null = null;
    private configReady = false;
    private pendingQueue: Array<{ name: string; data?: any }> = [];
    private loadingSet = new Set<string>();

    private constructor() {
        this.loadConfig();
    }

    static getInstance(): UIManagerClass {
        if (!this._instance) {
            this._instance = new UIManagerClass();
        }
        return this._instance;
    }

    // ==================== 初始化 ====================

    private get layer(): cc.Node | null {
        if (!this.viewLayer) {
            const canvas = cc.director.getScene()?.getChildByName('Canvas');
            this.viewLayer = canvas?.getChildByName('viewLayer') ?? null;
            if (!this.viewLayer) {
                cc.error('UIManager: viewLayer 节点不存在');
            }
        }
        return this.viewLayer;
    }

    private loadConfig(): void {
        cc.resources.load('Config/panel_config', cc.JsonAsset, (err, asset: cc.JsonAsset) => {
            if (err) {
                cc.warn('UIManager: 加载 panel_config 失败', err);
                return;
            }
            if (asset?.json) {
                this.configMap = asset.json;
            }
            this.configReady = true;
            this.flushPendingQueue();
        });
    }

    private flushPendingQueue(): void {
        while (this.pendingQueue.length > 0) {
            const item = this.pendingQueue.shift()!;
            this.show(item.name, item.data);
        }
    }

    // ==================== 核心 API ====================

    /**
     * 显示界面
     * 先显示新界面 → 再隐藏旧界面（防闪烁）
     */
    show(name: string, data?: any): void {
        if (!this.configReady) {
            this.pendingQueue.push({ name, data });
            return;
        }

        const config = this.configMap[name];
        if (!config) {
            cc.error(`UIManager: 界面 "${name}" 未在配置表中注册`);
            return;
        }

        if (this.currentPanel === name) {
            this.callOnShow(name, data);
            return;
        }

        if (this.panelStack.includes(name)) {
            cc.warn(`UIManager: 界面 "${name}" 在栈中，请先调用 close()`);
            return;
        }

        if (!this.layer) return;

        // ===== 情况 A：节点已存在 =====
        const existing = this.panelMap[name];
        if (existing && cc.isValid(existing.node)) {
            existing.node.active = true;
            this.callOnShow(name, data);
            this.stashCurrent(name);
            this.currentPanel = name;
            return;
        }

        // ===== 情况 B：预制体已缓存 =====
        const cachedPrefab = this.prefabCache[name];
        if (cachedPrefab) {
            // 注册到资源管理器（如果尚未注册）
            if (ResourceManager.getInstance().getResourceCount(name) === 0) {
                ResourceManager.getInstance().register(name, [cachedPrefab]);
            }
            this.instantiate(name, cachedPrefab, data);
            this.stashCurrent(name);
            this.currentPanel = name;
            return;
        }

        // ===== 情况 C：异步加载 =====
        if (this.loadingSet.has(name)) return;
        this.loadingSet.add(name);

        // 记住旧界面
        const prevPanel = this.currentPanel;
        this.currentPanel = name;

        cc.resources.load(config.path, cc.Prefab, (err, prefab: cc.Prefab) => {
            this.loadingSet.delete(name);

            if (err) {
                cc.error(`UIManager: 加载失败 "${config.path}"`, err);
                this.currentPanel = prevPanel;
                return;
            }

            this.prefabCache[name] = prefab;

            // 注册预制体到资源管理器
            ResourceManager.getInstance().register(name, [prefab]);

            if (this.currentPanel === name) {
                this.instantiate(name, prefab, data);
                if (prevPanel) {
                    this.hidePanel(prevPanel);
                    this.panelStack.push(prevPanel);
                }
                this.currentPanel = name;
            }
        });
    }

    /**
     * 关闭当前界面，返回上一个界面
     * 
     * scheduleOnce 的 target 用节点本身，节点销毁时自动取消回调
     */
    close(): void {
        if (!this.currentPanel) return;

        if (this.panelStack.length === 0) {
            cc.warn('UIManager: 当前只有一个界面，无法关闭');
            return;
        }

        const currentName = this.currentPanel;

        // ----- 销毁当前界面 -----
        const currentInfo = this.panelMap[currentName];
        if (currentInfo && cc.isValid(currentInfo.node)) {
            currentInfo.node.destroy();
        }
        delete this.panelMap[currentName];

        // ----- 释放当前界面的资源 -----
        ResourceManager.getInstance().release(currentName);
        delete this.prefabCache[currentName];

        // ----- 恢复上一个界面 -----
        const prevName = this.panelStack.pop()!;
        this.currentPanel = prevName;

        const prevInfo = this.panelMap[prevName];
        if (!prevInfo || !cc.isValid(prevInfo.node)) return;

        prevInfo.node.active = true;

        // 🔑 target 传 prevInfo.node，节点被销毁时自动取消回调
        this.scheduleOnce(() => {
            this.callOnShow(prevName);
        }, prevInfo.node);
    }

    /**
     * 返回上一个界面（不销毁当前界面）
     */
    back(): void {
        if (this.panelStack.length === 0) return;

        const prevName = this.panelStack.pop()!;

        if (this.currentPanel) {
            this.hidePanel(this.currentPanel);
            this.panelStack.push(this.currentPanel);
        }

        const prevInfo = this.panelMap[prevName];
        if (!prevInfo || !cc.isValid(prevInfo.node)) return;

        prevInfo.node.active = true;
        this.currentPanel = prevName;

        // 🔑 target 传 prevInfo.node
        this.scheduleOnce(() => {
            this.callOnShow(prevName);
        }, prevInfo.node);
    }

    /** 关闭所有界面 */
    closeAll(): void {
        const panelNames = Object.keys(this.panelMap);
        for (const name of panelNames) {
            const info = this.panelMap[name];
            if (info && cc.isValid(info.node)) {
                info.node.destroy();
            }
            ResourceManager.getInstance().release(name);
            delete this.prefabCache[name];
        }
        this.panelMap = {};
        this.panelStack = [];
        this.currentPanel = null;
    }

    getCurrentPanel(): string | null {
        return this.currentPanel;
    }

    isPanelLoaded(name: string): boolean {
        return !!this.panelMap[name];
    }

    // ==================== 私有方法 ====================

    /**
     * 延迟一帧执行回调
     * 
     * 🔑 target 传节点，节点被销毁时自动取消回调，避免报错
     * 
     * @param callback 要执行的回调
     * @param target   关联的节点（作为 scheduler 的 target）
     */
    private scheduleOnce(callback: () => void, target: cc.Node): void {
        cc.director.getScheduler().schedule(callback, target, 0, 0, 0, false);
    }

    /** 隐藏当前界面并入栈 */
    private stashCurrent(excludeName: string): void {
        if (this.currentPanel && this.currentPanel !== excludeName) {
            this.hidePanel(this.currentPanel);
            this.panelStack.push(this.currentPanel);
        }
    }

    /** 隐藏界面 */
    private hidePanel(name: string): void {
        const info = this.panelMap[name];
        if (info && cc.isValid(info.node)) {
            info.node.active = false;
        }
    }

    /** 实例化 */
    private instantiate(name: string, prefab: cc.Prefab, data?: any): void {
        const layer = this.layer;
        if (!layer) return;

        const node = cc.instantiate(prefab);
        node.parent = layer;

        const script = node.getComponent(cc.Component);
        this.panelMap[name] = { node, script, config: this.configMap[name] };

        this.callOnShow(name, data);
    }

    /** 调用 onShow */
    private callOnShow(name: string, data?: any): void {
        const info = this.panelMap[name];
        if (!info || !cc.isValid(info.node)) return;

        const script = info.script as any;
        if (script?.onShow) {
            script.onShow(data);
        }
    }
}

export default UIManagerClass;