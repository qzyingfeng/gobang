/**
 * LoginLayer - 登录界面
 * 继承 BasePage 实现登录功能
 * 处理主菜单交互：开始游戏、AI对战、设置、退出
 */

import BasePage from './base/BasePage';

const { ccclass, property } = cc._decorator;

@ccclass
export default class LoginLayer extends BasePage {
    @property({ type: cc.Button })
    btnStart: cc.Button = null!;

    @property({ type: cc.Button })
    btnAI: cc.Button = null!;

    @property({ type: cc.Button })
    btnSet: cc.Button = null!;

    @property({ type: cc.Button })
    btnExit: cc.Button = null!;

    onShow(data?: any) {
        super.onShow(data);
    }

    /** 初始化界面元素 */
    protected initView(): void {
        super.initView();
        this.AudioManager.playMusic('bgm_menu', true);
    }

    /** 初始化事件绑定 */
    protected initEvent(): void {
        super.initEvent();
        // 绑定按钮事件
        this.bindButton(this.btnStart, this.onStart);
        this.bindButton(this.btnAI, this.onStartAI);
        this.bindButton(this.btnSet, this.onOpenSetting);
        this.bindButton(this.btnExit, this.onClose);
    }


    onDisable() {
        super.onDisable();
        this.unbindButton(this.btnStart, this.onStart);
        this.unbindButton(this.btnAI, this.onStartAI);
        this.unbindButton(this.btnSet, this.onOpenSetting);
        this.unbindButton(this.btnExit, this.onClose);
    }

    /**
     * 绑定按钮事件
     * @param button 按钮组件
     * @param callback 回调函数
     */
    private bindButton(button: cc.Button, callback: () => void): void {
        if (button && button.node) {
            button.node.on(cc.Node.EventType.TOUCH_START, callback, this);
        }
    }

    /**
     * 解除按钮事件
     * @param button 按钮组件
     * @param callback 回调函数
     */
    private unbindButton(button: cc.Button, callback: () => void): void {
        if (button && button.node) {
            button.node.off(cc.Node.EventType.TOUCH_START, callback, this);
        }
    }

    /**
     * 人人对战开始
     */
    private onStart(): void {
        this.AudioManager.play('menuClick');
        cc.sys.localStorage.setItem('gameMode', 'pvp');
        this.UIManager.show('battleLayer');
    }

    /**
     * 人机对战开始
     */
    private onStartAI(): void {
        this.AudioManager.play('menuClick');
        cc.sys.localStorage.setItem('gameMode', 'pve');
        this.UIManager.show('battleLayer');
    }

    /**
     * 打开设置弹窗
     */
    private onOpenSetting(): void {
        this.AudioManager.play('menuClick');
        this.PopupManager.show('settingLayer');
    }

    /**
     * 退出游戏
     */
    protected onClose(): void {
        super.onClose();
        this.AudioManager.play('menuClick');
        cc.game.end();
    }
}