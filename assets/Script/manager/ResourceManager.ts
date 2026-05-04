/**
 * ResourceManager - 资源管理器
 * 处理 Cocos Creator 动态资源的加载、注册和释放
 * 单例模式
 * 
 * 使用方式：
 * 1. 加载资源：ResourceManager.getInstance().load('Prefab', 'prefabs/MyPrefab', 'MyScript')
 * 2. 脚本销毁时：ResourceManager.getInstance().release('MyScript')
 * 
 * 注意：
 * - 资源路径相对于 resources/ 目录
 * - 释放时Prefab会destroy()，其他资源会decRef()
 * - 依赖资源会自动释放（Prefab的依赖SpriteFrame等）
 */

type ResourceType = 'Prefab' | 'SpriteFrame' | 'AudioClip' | 'AnimationClip' | 'Material' | 'TextAsset' | 'Texture2D';

class ResourceManagerClass {
    /** 单例实例 */
    private static _instance: ResourceManagerClass | null = null;
    /** 资源存储：ownerName -> 资源数组 */
    private resources: Map<string, any> = new Map();
    /** 资源类型映射 */
    private typeMap = {
        'Prefab': cc.Prefab,
        'SpriteFrame': cc.SpriteFrame,
        'AudioClip': cc.AudioClip,
        'AnimationClip': cc.AnimationClip,
        'Material': cc.Material,
        'TextAsset': cc.TextAsset,
        'Texture2D': cc.Texture2D,
    };

    constructor() {}

    /**
     * 获取单例实例
     */
    static getInstance(): ResourceManagerClass {
        if (!this._instance) {
            this._instance = new ResourceManagerClass();
        }
        return this._instance;
    }

    /**
     * 加载资源并注册到管理器
     * @param resourceType 资源类型（Prefab/SpriteFrame/AudioClip/AnimationClip/Material/TextAsset/Texture2D）
     * @param path 资源路径（相对于 resources/ 目录）
     * @param ownerName 所有者名称（脚本名称，用于释放时定位）
     * @returns Promise<cc.Asset> 加载到的资源
     */
    load(resourceType: string, path: string, ownerName: string): Promise<cc.Asset> {
        const assetType = this.typeMap[resourceType];
        if (!assetType) {
            cc.error(`[ResourceManager] 不支持的资源类型: ${resourceType}`);
            return Promise.reject(new Error(`不支持的资源类型: ${resourceType}`));
        }

        return new Promise((resolve, reject) => {
            cc.resources.load(path, assetType, (err, asset) => {
                if (err) {
                    cc.error(`[ResourceManager] 加载资源失败: ${path}, 错误: ${err.message}`);
                    reject(err);
                    return;
                }

                if (asset) {
                    this.register(ownerName, [asset]);
                    resolve(asset);
                } else {
                    cc.error(`[ResourceManager] 资源为空: ${path}`);
                    reject(new Error('资源为空'));
                }
            });
        });
    }

    /**
     * 批量注册资源（用户手动加载的资源）
     * @param ownerName 脚本名称
     * @param assets 资源数组
     */
    register(ownerName: string, assets: any[]): void {
        if (!ownerName || !assets || assets.length === 0) {
            cc.warn(`[ResourceManager] register 参数无效: ownerName=${ownerName}, assets length=${assets?.length}`);
            return;
        }

        const existing = this.resources.get(ownerName);
        if (existing) {
            for (const asset of assets) {
                if (!existing.includes(asset)) {
                    existing.push(asset);
                }
            }
        } else {
            this.resources.set(ownerName, assets);
        }
        cc.log(`[ResourceManager] 注册资源: owner=${ownerName}, count=${assets.length}`);
    }

    /**
     * 释放某 owner 下的所有资源
     * 默认全部释放（节点销毁 + asset 引用计数减少）
     * @param ownerName 所有者名称（脚本名称）
     */
    release(ownerName: string): void {
        const assets = this.resources.get(ownerName);
        if (!assets || assets.length === 0) {
            cc.log(`[ResourceManager] 释放资源: owner=${ownerName}, 无资源`);
            return;
        }

        for (const asset of assets) {
            const assetType = (asset as any).constructor.name;
            if (assetType === 'Prefab') {
                const nodes = (asset as cc.Prefab).data as cc.Node;
                if (nodes && nodes.destroy) {
                    nodes.destroy();
                }
            }
            asset.decRef(true);
        }

        this.resources.delete(ownerName);
        cc.log(`[ResourceManager] 释放资源: owner=${ownerName}, count=${assets.length}`);
    }

    /**
     * 获取某 owner 下的资源数量
     * @param ownerName 所有者名称
     */
    getResourceCount(ownerName: string): number {
        const assets = this.resources.get(ownerName);
        return assets ? assets.length : 0;
    }

    /**
     * 获取所有 owner 名称
     */
    getAllOwners(): string[] {
        return Array.from(this.resources.keys());
    }

    /**
     * 清理所有资源（谨慎使用）
     */
    clearAll(): void {
        const owners = Array.from(this.resources.keys());
        for (const ownerName of owners) {
            this.release(ownerName);
        }
        cc.log('[ResourceManager] 已清理所有资源');
    }
}

export default ResourceManagerClass;