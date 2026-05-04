/**
 * TipManager - 提示管理器
 * 管理 tipLayer 上的系统提示
 * 支持多提示同时存在、自动销毁、布局
 * 单例模式，通过懒加载获取层节点
 */
import ResourceManager from './ResourceManager';

interface TipConfig {
    path: string;
    duration?: number;
    [key: string]: any;
}

interface TipInstance {
    name: string;
    node: cc.Node;
    script: any;
    config: TipConfig;
}

class TipManagerClass {
    /** 单例实例 */
    private static _instance: TipManagerClass | null = null;
    /** 提示配置表 */
    private tipConfig: { [key: string]: TipConfig } = {};
    /** 预制体缓存 */
    private prefabCache: { [key: string]: cc.Prefab } = {};
    /** 当前显示的提示实例 */
    private tips: TipInstance[] = [];
    /** 提示层节点（懒加载） */
    private tipLayer: cc.Node | null = null;
    /** 配置加载状态 */
    private configLoaded: boolean = false;
    /** 提示排列配置 */
    private tipSpacing: number = 10;
    private tipBaseY: number = 0;

    constructor() {
        this.loadConfig();
    }

    /**
     * 获取单例实例
     */
    static getInstance(): TipManagerClass {
        if (!this._instance) {
            this._instance = new TipManagerClass();
        }
        return this._instance;
    }

    /**
     * 懒加载获取提示层节点
     */
    private ensureLayer(): cc.Node | null {
        if (!this.tipLayer) {
            const canvas = cc.director.getScene()?.getChildByName('Canvas');
            this.tipLayer = canvas?.getChildByName('tipLayer') || null;
            if (!this.tipLayer) {
                cc.error('TipManager: tipLayer 节点不存在');
            }
        }
        return this.tipLayer;
    }

    /**
     * 加载配置表
     */
    private loadConfig(): void {
        cc.resources.load('Config/tip_config', cc.JsonAsset, (err: Error | null, data: cc.JsonAsset) => {
            if (err) {
                cc.warn('TipManager: 加载 tip_config 失败', err);
            } else if (data && data.json) {
                this.tipConfig = data.json;
            }
            this.configLoaded = true;
            cc.log('TipManager: 配置表加载完成');
        });
    }

    /**
     * 显示提示
     * @param tipName 提示名称
     * @param data 传递的数据
     */
    showTip(tipName: string, data?: any): void {
        if (!this.configLoaded) {
            cc.warn('TipManager: 配置表未加载完成');
            return;
        }

        const config = this.tipConfig[tipName];
        if (!config) {
            cc.error(`TipManager: 提示 ${tipName} 未在配置表中注册`);
            return;
        }

        const layer = this.ensureLayer();
        if (!layer) return;

        this.createTip(tipName, config, data);
    }

    /**
     * 创建提示实例
     */
    private createTip(tipName: string, config: TipConfig, data?: any): void {
        let prefab = this.prefabCache[tipName];

        if (!prefab) {
            cc.resources.load(config.path, cc.Prefab, (err: Error | null, res: cc.Prefab) => {
                if (err) {
                    cc.error(`TipManager: 加载预制体失败 ${config.path}`, err);
                    return;
                }

                this.prefabCache[tipName] = res;

                // 注册预制体到资源管理器
                ResourceManager.getInstance().register(tipName, [res]);

                this.instantiateTip(tipName, config, res, data);
            });
            return;
        }

        // 有缓存时注册到资源管理器（如果尚未注册）
        if (ResourceManager.getInstance().getResourceCount(tipName) === 0) {
            ResourceManager.getInstance().register(tipName, [prefab]);
        }

        this.instantiateTip(tipName, config, prefab, data);
    }

    /**
     * 实例化提示
     */
    private instantiateTip(tipName: string, config: TipConfig, prefab: cc.Prefab, data?: any): void {
        const layer = this.ensureLayer();
        if (!layer) return;

        const node = cc.instantiate(prefab);
        node.parent = layer;
        node.active = true;

        const script = node.getComponent(cc.Component);

        const tipInstance: TipInstance = {
            name: tipName,
            node,
            script,
            config
        };

        this.tips.push(tipInstance);

        if (script && typeof script["show"] === 'function') {
            // script.show(data);
        }

        this.layoutTips();

        const duration = config.duration || 0;
        if (duration > 0) {
            setTimeout(() => {
                this.removeTip(tipInstance);
            }, duration * 1000);
        }
    }

    /**
     * 移除提示
     */
    private removeTip(tipInstance: TipInstance): void {
        const index = this.tips.indexOf(tipInstance);
        if (index !== -1) {
            if (tipInstance.script && typeof tipInstance.script.hide === 'function') {
                tipInstance.script.hide();
            }

            tipInstance.node.destroy();

            // 释放提示资源
            ResourceManager.getInstance().release(tipInstance.name);
            delete this.prefabCache[tipInstance.name];

            this.tips.splice(index, 1);
            this.layoutTips();
        }
    }

    /**
     * 布局提示
     */
    private layoutTips(): void {
        let currentY = this.tipBaseY;
        
        for (const tip of this.tips) {
            tip.node.setPosition(0, currentY);
            currentY -= tip.node.height + this.tipSpacing;
        }
    }

    /**
     * 隐藏指定提示
     * @param tipName 提示名称
     */
    hideTip(tipName: string): void {
        const index = this.tips.findIndex(t => {
            const config = this.tipConfig[tipName];
            return t.config === config;
        });

        if (index !== -1) {
            this.removeTip(this.tips[index]);
        }
    }

    /**
     * 隐藏所有提示
     */
    hideAllTips(): void {
        const tipsToRemove = [...this.tips];
        for (const tip of tipsToRemove) {
            this.removeTip(tip);
        }
    }

    /**
     * 获取当前显示的提示数量
     */
    getTipCount(): number {
        return this.tips.length;
    }

    /**
     * 设置提示间距
     * @param spacing 间距
     */
    setSpacing(spacing: number): void {
        this.tipSpacing = spacing;
        this.layoutTips();
    }

    /**
     * 设置提示基线 Y 坐标
     * @param y Y 坐标
     */
    setBaseY(y: number): void {
        this.tipBaseY = y;
        this.layoutTips();
    }
}

export default TipManagerClass;