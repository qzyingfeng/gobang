/**
 * PopupManager - 弹窗管理器（精简注释版）
 * 
 * 功能：统一管理游戏中所有弹窗的显示、关闭
 * 
 * 核心设计：
 * 1. 单例模式 —— 全局只有一个管理器实例
 * 2. 懒加载    —— 弹窗预制体用的时候才加载，加载过就缓存
 * 3. 防竞态    —— 同一个弹窗正在加载时，再次调用 show 不会重复加载
 * 4. 参数缓存  —— 加载期间传来的参数会暂存，加载完自动补上
 */
import EventConst from '../config/EventConst';
import EventEmitter from './EventEmitter';
import ResourceManager from './ResourceManager';

// ============================================================
// 类型定义
// ============================================================

/** 弹窗配置（来自 popup_config 配置表） */
interface PopupConfig {
    path: string;           // 预制体路径，如 "prefabs/TipsPopup"
    [key: string]: any;     // 其他自定义字段
}

/** 加载期间暂存的数据：用户调用 show 时传的 data 和 closeCallback */
interface PendingShow {
    data?: any;
    closeCallback?: () => void;
}

// ============================================================
// 管理器本体
// ============================================================
class PopupManagerClass {
    // ---------- 单例 ----------
    private static _instance: PopupManagerClass;

    // ---------- 数据容器 ----------

    /** 配置表数据：弹窗名 -> 配置对象 
     *  例：{ "TipsPopup": { path: "prefabs/TipsPopup" } }
     */
    private configMap: Record<string, PopupConfig> = {};

    /** 预制体缓存：弹窗名 -> 加载好的预制体 
     *  避免重复从磁盘加载同一个预制体
     */
    private prefabCache: Record<string, cc.Prefab> = {};

    /** 当前所有弹窗节点：弹窗名 -> 场景中的节点 
     *  这是弹窗管理器的主数据，所有操作都围绕它
     */
    private nodeMap: Record<string, cc.Node> = {};

    /** 配置表是否加载完成 */
    private configReady = false;

    /** 正在异步加载中的弹窗集合 
     *  用 Set 存弹窗名，查重比数组快
     */
    private loadingSet = new Set<string>();

    /** 加载期间暂存的参数：弹窗名 -> { data, closeCallback }
     *  等预制体加载完，从这个 map 取出参数传给 onShow
     */
    private pendingMap: Record<string, PendingShow> = {};

    /** popupLayer 节点缓存 
     *  懒加载：第一次用的时候才去场景里找，之后直接用缓存
     */
    private popupLayer: cc.Node | null = null;

    // ---------- 构造函数 ----------
    /** 
     * 私有构造函数，外部不能 new
     * 一创建就自动加载配置表
     */
    private constructor() {
        this.loadConfig();
    }

    /** 获取单例 */
    static getInstance(): PopupManagerClass {
        if (!this._instance) {
            this._instance = new PopupManagerClass();
        }
        return this._instance;
    }

    // ============================================================
    // 初始化相关
    // ============================================================

    /** 异步加载配置表 */
    private loadConfig() {
        cc.resources.load(
            'Config/popup_config',      // 配置表路径
            cc.JsonAsset,               // 资源类型：JSON
            (err, asset: cc.JsonAsset) => {
                if (err) {
                    cc.warn('PopupManager: 加载 popup_config 失败', err);
                    return;
                }
                if (asset?.json) {
                    this.configMap = asset.json;
                }
                this.configReady = true;
                cc.log('PopupManager: 配置表加载完成');
            }
        );
    }

    /** 
     * 获取 popupLayer 节点（懒加载 + 缓存）
     * 使用 getter 语法，访问 this.layer 就会自动执行
     */
    private get layer(): cc.Node | null {
        // 如果已经找过了，直接返回缓存
        if (!this.popupLayer) {
            // 获取场景根节点 Canvas
            const canvas = cc.director.getScene()?.getChildByName('Canvas');
            // 从 Canvas 下找 popupLayer 子节点
            this.popupLayer = canvas?.getChildByName('popupLayer') ?? null;

            if (this.popupLayer) {
                // 只注册一次事件监听（防止反复注册导致内存泄漏）
                // 第三个参数 this 是回调函数里的 this 指向
                EventEmitter.getInstance().on(
                    EventConst.POPUP_CLOSE,   // 事件名
                    this.onPopupClose,        // 回调
                    this                      // this 指向
                );
            } else {
                cc.error('PopupManager: popupLayer 节点不存在，请在场景中添加');
            }
        }
        return this.popupLayer;
    }

    // ============================================================
    // 核心 API（对外方法）
    // ============================================================

    /**
     * 显示弹窗
     * 
     * @param name         弹窗名称（配置表里的 key）
     * @param data         传给弹窗的数据（可选）
     * @param closeCallback 弹窗关闭时的回调（可选）
     * 
     * 流程：
     * 1. 检查配置是否就绪、弹窗是否已注册、popupLayer 是否存在
     * 2. 如果节点已存在且有效 → 直接激活 + 调用 onShow
     * 3. 如果正在加载中 → 缓存参数，等加载完自动调用
     * 4. 如果预制体已缓存 → 直接实例化
     * 5. 否则 → 异步加载预制体，加载完实例化
     */
    show(name: string, data?: any, closeCallback?: () => void): void {
        // ----- 第1步：合法性检查 -----
        if (!this.configReady) {
            cc.warn('PopupManager: 配置未就绪，请延后调用 show');
            return;
        }
        const config = this.configMap[name];
        if (!config) {
            cc.error(`PopupManager: 弹窗 "${name}" 未在配置表中注册`);
            return;
        }
        if (!this.layer) return; // popupLayer 不存在

        // ----- 第2步：节点已存在 → 直接复用 -----
        const node = this.nodeMap[name];
        if (node && cc.isValid(node)) {
            // 激活节点（可能之前被 deactive 了）
            node.active = true;
            // 调用弹窗的 onShow 方法
            this.invokeShow(name, data, closeCallback);
            return;
        }

        // ----- 第3步：正在加载中 → 只暂存参数，不重复发起加载 -----
        if (this.loadingSet.has(name)) {
            this.pendingMap[name] = { data, closeCallback };
            return;
        }

        // ----- 第4步：需要加载 -----
        // 先暂存参数
        this.pendingMap[name] = { data, closeCallback };

        // 检查预制体缓存
        const cachedPrefab = this.prefabCache[name];
        if (cachedPrefab) {
            // 有缓存 → 注册到资源管理器（如果尚未注册）
            if (ResourceManager.getInstance().getResourceCount(name) === 0) {
                ResourceManager.getInstance().register(name, [cachedPrefab]);
            }
            // 有缓存 → 直接实例化（同步操作）
            this.instantiateNode(name, cachedPrefab);
            return;
        }

        // ----- 第5步：没有缓存 → 异步加载预制体 -----
        this.loadingSet.add(name); // 标记为"加载中"
        cc.resources.load(config.path, cc.Prefab, (err, prefab: cc.Prefab) => {
            this.loadingSet.delete(name); // 加载完成，移除标记

            if (err) {
                cc.error(`PopupManager: 加载失败 "${config.path}"`, err);
                // 加载失败，清理暂存的参数
                delete this.pendingMap[name];
                return;
            }

            // 缓存预制体，下次不用再加载
            this.prefabCache[name] = prefab;

            // 注册预制体到资源管理器
            ResourceManager.getInstance().register(name, [prefab]);

            // 实例化节点并显示
            this.instantiateNode(name, prefab);
        });
    }

    /**
     * 关闭指定弹窗
     * @param name 弹窗名称
     * 
     * 直接销毁节点并从 nodeMap 中删除
     */
    close(name: string): void {
        const node = this.nodeMap[name];
        if (!node) return;
        if (!cc.isValid(node)) {
            // 节点已经无效了，只清记录
            delete this.nodeMap[name];
            delete this.pendingMap[name];
            return;
        }

        // 先从 nodeMap 删掉，再销毁（防止销毁回调里又触发 close）
        delete this.nodeMap[name];
        delete this.pendingMap[name];

        node.destroy();

        // 释放弹窗资源
        ResourceManager.getInstance().release(name);
        delete this.prefabCache[name];
    }

    /**
     * 关闭所有弹窗
     * 直接遍历 nodeMap，逐个关闭
     */
    closeAll(): void {
        // Object.keys 获取所有弹窗名称的数组
        for (const name in this.nodeMap) {
            this.close(name);
        }
    }

    /**
     * 检查某个弹窗是否正在显示
     * @param name 弹窗名称
     * @returns true=正在显示，false=未显示或不存在
     */
    isShowing(name: string): boolean {
        const node = this.nodeMap[name];
        // 节点存在 + 有效 + active 为 true
        return !!node && cc.isValid(node) && node.active;
    }

    /**
     * 当前显示的弹窗数量
     * 使用 getter 语法，像属性一样访问：popupManager.count
     */
    get count(): number {
        return Object.keys(this.nodeMap).length;
    }

    // ============================================================
    // 私有方法（内部使用）
    // ============================================================

    /**
     * 实例化节点并放入场景（同步操作）
     * 
     * @param name   弹窗名称
     * @param prefab 预制体资源
     * 
     * 步骤：
     * 1. 用预制体克隆一个新节点
     * 2. 挂到 popupLayer 下
     * 3. 记录到 nodeMap
     * 4. 取出暂存的参数，调用 onShow
     */
    private instantiateNode(name: string, prefab: cc.Prefab): void {
        const layer = this.layer;
        if (!layer) return;

        // 克隆预制体，生成新节点
        const node = cc.instantiate(prefab);
        // 设置父节点为 popupLayer
        node.parent = layer;
        // 记录到 nodeMap（之后可以通过弹窗名找到这个节点）
        this.nodeMap[name] = node;

        // 取出之前暂存的参数
        const pending = this.pendingMap[name];
        // 取出后立即删除，避免内存残留
        delete this.pendingMap[name];

        // 调用 onShow，传入暂存的参数
        this.invokeShow(name, pending?.data, pending?.closeCallback);
    }

    /**
     * 调用弹窗组件的 onShow 方法（统一的调用入口）
     * 
     * @param name          弹窗名称
     * @param data          传给 onShow 的数据
     * @param closeCallback 传给 onShow 的关闭回调
     * 
     * 说明：
     * 所有需要调用 onShow 的地方都走这个方法，
     * 避免到处写重复的判断逻辑
     */
    private invokeShow(name: string,data?: any,closeCallback?: () => void): void {
        const node = this.nodeMap[name];
        // 安全检查：节点不存在或已被销毁
        if (!node || !cc.isValid(node)) return;

        // 获取节点上的第一个组件（弹窗脚本）
        const comp = node.getComponent(cc.Component);
        // 检查组件上是否有 onShow 方法
        if (comp && typeof (comp as any).onShow === 'function') {
            // 调用 onShow，传入 data 和 closeCallback
            (comp as any).onShow(data, closeCallback);
        }
    }

    /**
     * 事件回调：收到 POPUP_CLOSE 事件时执行
     * 弹窗脚本里发 EventConst.POPUP_CLOSE 事件并传弹窗名，
     * 这里收到后自动关闭对应弹窗
     */
    private onPopupClose(popupName: string): void {
        this.close(popupName);
    }
}

// ============================================================
// 导出
// ============================================================
export default PopupManagerClass;