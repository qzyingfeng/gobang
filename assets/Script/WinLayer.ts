/**
 * WinLayer - 胜利弹窗
 * 继承 BasePopup 实现胜利显示和操作
 * 功能：显示胜负、重新开始、查看回放、返回主菜单
 * 
 * 使用方式：
 * - 通过 PopupManager.show('winLayer', { winner: 1 }) 显示
 * - winner 参数：1=黑方获胜，2=白方获胜
 */

import BasePopup from './base/BasePopup';

const { ccclass, property } = cc._decorator;

@ccclass
export default class WinLayer extends BasePopup {
    /** 胜利信息显示标签 */
    @property({ type: cc.Label })
    winLabel: cc.Label = null!;

    /** 重新开始按钮 */
    @property({ type: cc.Button })
    btnRestart: cc.Button = null!;

    /** 查看回放按钮 */
    @property({ type: cc.Button })
    btnReplay: cc.Button = null!;

    /** 返回主菜单按钮 */
    @property({ type: cc.Button })
    btnReturn: cc.Button = null!;

    /** 当前获胜方：1=黑方，2=白方 */
    private winner: number = 1;

    /**
     * 初始化界面视图
     * 调用父类方法初始化基类功能，加载UI组件等
     */
    protected initView(): void {
        super.initView();
    }

    /**
     * 初始化事件监听
     * 绑定按钮点击事件到对应的处理函数
     */
    protected initEvent(): void {
        super.initEvent();
        this.btnRestart.node.on(cc.Node.EventType.TOUCH_START, this.onRestart, this);
        this.btnReplay.node.on(cc.Node.EventType.TOUCH_START, this.onReplay, this);
        this.btnReturn.node.on(cc.Node.EventType.TOUCH_START, this.onReturn, this);
    }

    /**
     * 弹窗显示时的回调
     * @param data - 传入的数据对象，包含 winner 属性表示获胜方
     */
    onShow(data?: any): void {
        // 调用父类方法执行显示逻辑
        super.onShow(data);
        // 从传入数据中获取获胜方并更新显示
        if (data && data.winner) {
            this.winner = data.winner;
            this.updateWinLabel();
        }
    }

    onDisable() {
        this.btnRestart.node.off(cc.Node.EventType.TOUCH_START, this.onRestart, this);
        this.btnReplay.node.off(cc.Node.EventType.TOUCH_START, this.onReplay, this);
        this.btnReturn.node.off(cc.Node.EventType.TOUCH_START, this.onReturn, this);
        super.onDisable();
    }

    /**
     * 更新胜利显示文本
     * 根据获胜方显示"黑方获胜"或"白方获胜"
     */
    private updateWinLabel(): void {
        if (this.winLabel) {
            this.winLabel.string = this.winner === 1 ? '黑方获胜' : '白方获胜';
        }
    }

    /**
     * 重新开始按钮点击处理
     * 向所有活跃界面广播重新开始，关闭弹窗
     */
    private onRestart(): void {
        this.AudioManager.play('buttonClick');
        this.broadcastAll('restartGame');
        this.onClose();
    }

    /**
     * 关闭当前弹窗
     */
    protected onClose(): void {
        super.onClose();
        this.AudioManager.play('menuClick');
    }

    /**
     * 查看回放按钮点击处理
     * 播放音效，关闭弹窗，向活跃界面广播开始回放
     */
    private onReplay(): void {
        this.AudioManager.play('buttonClick');
        this.onClose();
        this.broadcastAll('startReplay');
    }

    /**
     * 返回主菜单按钮点击处理
     * 播放返回音效，向活跃界面广播停止回放和重新开始，关闭弹窗并显示登录界面
     */
    private onReturn(): void {
        this.AudioManager.play('menuClick');
        this.broadcastAll('stopReplay');
        this.broadcastAll('restartGame');
        this.onClose();
        this.UIManager.show('loginLayer');
    }

}