/**
 * 胜利弹窗管理器 - 直接在场景中创建弹窗
 * 替代预制体方案，避免预制体文件问题
 */

cc.Class({
    extends: cc.Component,

    properties: {
        // 胜利文本标签
        winLabel: cc.Label,
        // 重新开始按钮
        restartButton: cc.Button,
        // 返回菜单按钮
        menuButton: cc.Button,
        // 弹窗根节点
        popupNode: cc.Node,
    },

    /**
     * 组件加载时调用
     */
    onLoad() {
        // 初始化弹窗状态
        this.popupNode.active = false;
        
        // 设置按钮事件
        this.restartButton.node.on(cc.Node.EventType.TOUCH_START, this.onRestartClick, this);
        this.menuButton.node.on(cc.Node.EventType.TOUCH_START, this.onMenuClick, this);
        
        // 检查音效管理器
        if (typeof AudioManager === 'undefined') {
            cc.warn("AudioManager未定义，音效功能将不可用");
        }
    },

    /**
     * 显示胜利弹窗
     * @param {number} winnerIdx - 获胜方索引：1表示黑子，2表示白子
     */
    showWinPopup(winnerIdx) {
        // 根据获胜方索引设置显示文本
        let winnerText = winnerIdx === 1 ? "黑子" : "白子";
        // 更新胜利文本标签内容
        this.winLabel.string = winnerText + "获胜！";
        // 激活弹窗节点，使其可见
        this.popupNode.active = true;
    },

    /**
     * 隐藏胜利弹窗
     */
    hideWinPopup() {
        // 停用弹窗节点，使其不可见
        this.popupNode.active = false;
    },

    /**
     * 重新开始按钮点击事件处理
     */
    onRestartClick() {
        // 播放按钮点击音效
        if (typeof AudioManager !== 'undefined') {
            AudioManager.play('buttonClick');
        }
        
        // 隐藏弹窗
        this.hideWinPopup();
        // 重新加载战斗场景
        cc.director.loadScene("Battle");
    },

    /**
     * 主菜单按钮点击事件处理
     */
    onMenuClick() {
        // 播放按钮点击音效
        if (typeof AudioManager !== 'undefined') {
            AudioManager.play('buttonClick');
        }
        
        // 隐藏弹窗
        this.hideWinPopup();
        // 加载登录场景
        cc.director.loadScene("Login");
    },
});