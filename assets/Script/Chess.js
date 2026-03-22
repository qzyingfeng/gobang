/**
 * 棋子脚本 - 处理棋子UI显示
 * 负责根据玩家索引更新棋子外观（黑子或白子）
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
    },

    /**
     * 节点第一次激活时调用
     */
    start() {
        // 棋子初始化逻辑
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
        let currentSpriteFrame = this.getComponent(cc.Sprite).spriteFrame;
        
        // 遍历所有棋子精灵帧，找到匹配的索引
        for (let i = 0; i < this.sptFrames.length; i++) {
            if (this.sptFrames[i] === currentSpriteFrame) {
                return i + 1;  // 返回玩家索引（从1开始）
            }
        }
        
        return 0;  // 未知类型
    },
});