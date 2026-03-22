

cc.Class({
    extends: cc.Component,

    properties: {
        // AI对战按钮（在编辑器中绑定）
        aiBattleButton: cc.Button,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        // 绑定AI对战按钮事件
        if (this.aiBattleButton && this.aiBattleButton.node) {
            this.aiBattleButton.node.on(cc.Node.EventType.TOUCH_START, 
                this.onStartAI, this);
        }
    },

    // update (dt) {},

    onStart() {
        // 播放菜单按钮点击音效
        if (typeof AudioManager !== 'undefined') {
            AudioManager.play('menuClick');
        }
        
        // 人人对战模式
        cc.sys.localStorage.setItem('gameMode', 'pvp');
        cc.director.loadScene("Battle");
    },

    onStartAI() {
        // 播放菜单按钮点击音效
        if (typeof AudioManager !== 'undefined') {
            AudioManager.play('menuClick');
        }
        
        // 人机对战模式
        cc.sys.localStorage.setItem('gameMode', 'pve');
        cc.director.loadScene("Battle");
    },

    onExit() {
        // 播放菜单按钮点击音效
        if (typeof AudioManager !== 'undefined') {
            AudioManager.play('menuClick');
        }
        
        cc.game.end();
    },

    onDestroy() {
        // 清理事件监听
        if (this.aiBattleButton && this.aiBattleButton.node) {
            this.aiBattleButton.node.off(cc.Node.EventType.TOUCH_START, 
                this.onStartAI, this);
        }
    }
});
