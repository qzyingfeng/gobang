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
        // 查看回放按钮
        replayButton: cc.Button,
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
        
        // 绑定回放按钮事件（如果存在）
        if (this.replayButton) {
            this.replayButton.node.on(cc.Node.EventType.TOUCH_START, this.onReplayClick, this);
        }
    },

    /**
     * 显示胜利弹窗（带缩放+淡入动画）
     * @param {number} winnerIdx - 获胜方索引：1表示黑子，2表示白子
     */
    showWinPopup(winnerIdx) {
        // 根据获胜方索引设置显示文本
        const winnerText = winnerIdx === 1 ? "黑子" : "白子";
        // 更新胜利文本标签内容
        this.winLabel.string = `${winnerText}获胜！`;
        
        // 设置初始状态（缩放为0，完全透明）
        this.popupNode.setScale(0);
        this.popupNode.opacity = 0;
        
        // 激活弹窗节点，使其可见
        this.popupNode.active = true;
        
        // 播放弹性缩放动画（0.5s）
        const scaleAction = cc.scaleTo(0.5, 1).easing(cc.easeBackOut());
        
        // 播放淡入动画（0.3s）
        const fadeAction = cc.fadeTo(0.3, 255);
        
        // 同时播放缩放和淡入
        this.popupNode.runAction(scaleAction);
        this.popupNode.runAction(fadeAction);
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
        AudioManager.play('buttonClick');
        
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
        AudioManager.play('buttonClick');
        
        // 隐藏弹窗
        this.hideWinPopup();
        // 加载登录场景
        cc.director.loadScene("Login");
    },
    
    /**
     * 查看回放按钮点击事件处理
     */
    onReplayClick() {
        // 播放按钮点击音效
        AudioManager.play('buttonClick');
        
        // 获取父节点（Battle场景根节点）
        const battleNode = this.node.parent;
        if (battleNode) {
            const battleScript = battleNode.getComponent("Battle");
            if (battleScript) {
                // 调用Battle的startReplay方法
                battleScript.startReplay();
            }
        }
    },
});
