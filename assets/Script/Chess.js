/**
 * 棋子脚本 - 处理棋子UI显示
 * 负责根据玩家索引更新棋子外观（黑子或白子）
 * 
 * 性能优化版本：
 * - 标记节点只创建一次，后续通过active切换显示
 * - 动画对象复用，避免频繁创建
 * - Graphics绘制只执行一次
 */

cc.Class({
    extends: cc.Component,

    properties: {
        // 棋子精灵帧数组，索引0为黑子，索引1为白子
        sptFrames: [cc.SpriteFrame],
    },

    /**
     * 组件加载时调用
     */
    onLoad() {
        // 初始化棋子显示
        this.initChess();
        
        // 初始化标记节点（只创建一次）
        this.markerNode = null;
        
        // 缓存动画模板（只创建一次）
        this._placeAnimTemplate = cc.scaleTo(0.2, 1).easing(cc.easeBackOut());
    },

    /**
     * 节点第一次激活时调用
     */
    start() {
        // 棋子初始化逻辑
    },

    /**
     * 组件销毁时调用
     */
    onDestroy() {
        // 清理标记节点
        if (this.markerNode) {
            this.markerNode.destroy();
            this.markerNode = null;
        }
        
        // 清理动画模板
        this._placeAnimTemplate = null;
    },

    /**
     * 初始化棋子
     * 设置默认显示状态
     */
    initChess() {
        // 默认显示黑子（索引0）
        if (this.sptFrames && this.sptFrames.length > 0) {
            this.getComponent(cc.Sprite).spriteFrame = this.sptFrames[0];
        }
    },

    /**
     * 更新棋子UI显示
     * @param {number} idx - 玩家索引：1表示黑子，2表示白子
     */
    updateUI(idx) {
        // 检查索引是否有效
        if (idx < 1 || idx > this.sptFrames.length) {
            cc.error("无效的棋子索引: ", idx);
            return;
        }
        
        // 更新棋子精灵帧
        // 数组索引从0开始，玩家索引从1开始，所以需要减1
        this.getComponent(cc.Sprite).spriteFrame = this.sptFrames[idx - 1];
    },

    /**
     * 设置棋子透明度（用于预览棋子）
     * @param {number} opacity - 透明度值（0-255）
     */
    setOpacity(opacity) {
        this.node.opacity = opacity;
    },

    /**
     * 获取当前棋子类型
     * @returns {number} 玩家索引：1表示黑子，2表示白子
     */
    getChessType() {
        // 根据当前显示的精灵帧判断棋子类型
        const currentSpriteFrame = this.getComponent(cc.Sprite).spriteFrame;
        
        // 遍历所有棋子精灵帧，找到匹配的索引
        for (let i = 0; i < this.sptFrames.length; i++) {
            if (this.sptFrames[i] === currentSpriteFrame) {
                return i + 1;  // 返回玩家索引（从1开始）
            }
        }
        
        return 0;  // 未知类型
    },

    /**
     * 播放落子动画
     * 棋子从缩小状态缩放到正常大小，带有弹性效果
     * 性能优化：复用动画模板，避免每次创建新对象
     * @param {Function} callback - 动画完成后的回调函数（可选）
     */
    playPlaceAnimation(callback) {
        // 设置初始缩放为0
        this.node.scale = 0;
        
        // 克隆动画模板（比创建新对象更高效）
        let action = this._placeAnimTemplate.clone();
        
        // 如果有回调，添加回调动作
        if (callback) {
            action = cc.sequence(action, cc.callFunc(callback));
        }
        
        this.node.runAction(action);
    },

    /**
     * 显示最后落子标记
     * 性能优化：标记节点只创建一次，后续通过active切换
     */
    showLastMoveMarker() {
        // 如果标记节点不存在，创建一次
        if (!this.markerNode) {
            this.markerNode = new cc.Node("LastMoveMarker");
            this.markerNode.parent = this.node;
            
            // 添加绘图组件，只绘制一次
            const graphics = this.markerNode.addComponent(cc.Graphics);
            graphics.fillColor = cc.Color.RED;
            graphics.circle(0, 0, 8);
            graphics.fill();
            
            // 设置标记位置（棋子中心）
            this.markerNode.setPosition(0, 0);
        }
        
        // 显示标记（不重新创建）
        this.markerNode.active = true;
    },

    /**
     * 隐藏最后落子标记
     * 性能优化：只隐藏节点，不销毁
     */
    hideLastMoveMarker() {
        if (this.markerNode) {
            this.markerNode.active = false;
        }
    },

    /**
     * 重置棋子状态（用于对象池复用）
     * 在从对象池取出棋子时调用，重置所有状态
     */
    reset() {
        // 停止所有动画
        this.node.stopAllActions();
        
        // 重置缩放
        this.node.scale = 1;
        
        // 重置透明度
        this.node.opacity = 255;
        
        // 隐藏最后落子标记
        this.hideLastMoveMarker();
        
        // 重置阴影节点
        this.resetShadow();
        
        // 显示节点
        this.node.active = true;
    },

    /**
     * 重置阴影节点状态
     * 阴影节点是棋子的子节点，需要单独重置
     */
    resetShadow() {
        // 查找阴影子节点
        const shadowNode = this.node.getChildByName("Shadow");
        if (shadowNode) {
            // 重置阴影透明度（默认180）
            shadowNode.opacity = 180;
            
            // 重置阴影位置（默认(0, -8)）
            shadowNode.setPosition(0, -8);
            
            // 重置阴影缩放
            shadowNode.scale = 1;
            
            // 停止阴影节点的动画
            shadowNode.stopAllActions();
            
            // 显示阴影节点
            shadowNode.active = true;
        }
    },
});
