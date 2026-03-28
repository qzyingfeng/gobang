/**
 * 登录场景脚本
 * 处理主菜单交互：开始游戏、AI对战、设置、退出
 */

cc.Class({
    extends: cc.Component,

    properties: {
        // AI对战按钮（在编辑器中绑定）
        aiBattleButton: cc.Button,
        // 设置按钮（在编辑器中绑定）
        settingButton: cc.Button,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {
        // 初始化设置管理器
        SettingManager.init();
        // 应用设置
        AudioManager.setMusicVolume(SettingManager.getMusicVolume());
        AudioManager.setDefaultVolume(SettingManager.getSoundVolume());
        
        // 播放主菜单背景音乐
        AudioManager.playMusic('bgm_menu', true);
        
        // 绑定AI对战按钮事件
        if (this.aiBattleButton && this.aiBattleButton.node) {
            this.aiBattleButton.node.on(cc.Node.EventType.TOUCH_START, 
                this.onStartAI, this);
        }
        
        // 绑定设置按钮事件
        if (this.settingButton && this.settingButton.node) {
            this.settingButton.node.on(cc.Node.EventType.TOUCH_START, 
                this.onOpenSetting, this);
        }
    },

    // update (dt) {},

    onStart() {
        // 播放菜单按钮点击音效
        AudioManager.play('menuClick');
        
        // 人人对战模式
        cc.sys.localStorage.setItem('gameMode', 'pvp');
        cc.director.loadScene("Battle");
    },

    onStartAI() {
        // 播放菜单按钮点击音效
        AudioManager.play('menuClick');
        
        // 人机对战模式
        cc.sys.localStorage.setItem('gameMode', 'pve');
        cc.director.loadScene("Battle");
    },

    onOpenSetting() {
        // 播放菜单按钮点击音效
        AudioManager.play('menuClick');
        
        // 加载设置场景
        cc.director.loadScene("Setting");
    },

    onExit() {
        // 播放菜单按钮点击音效
        AudioManager.play('menuClick');
        
        cc.game.end();
    },

    onDestroy() {
        // 清理事件监听
        if (this.aiBattleButton && this.aiBattleButton.node) {
            this.aiBattleButton.node.off(cc.Node.EventType.TOUCH_START, 
                this.onStartAI, this);
        }
        if (this.settingButton && this.settingButton.node) {
            this.settingButton.node.off(cc.Node.EventType.TOUCH_START, 
                this.onOpenSetting, this);
        }
    }
});
