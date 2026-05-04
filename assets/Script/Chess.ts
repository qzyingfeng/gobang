/**
 * Chess - 棋子组件
 * 处理棋子UI显示，负责根据玩家索引更新棋子外观（黑子或白子）
 * 
 * 性能优化版本：
 * - 标记节点只创建一次，后续通过active切换显示
 * - 动画对象复用，避免频繁创建
 * - Graphics绘制只执行一次
 */

import BaseUI from './base/BaseUI';

const { ccclass, property } = cc._decorator;

@ccclass
export default class Chess extends BaseUI {
    /** 棋子精灵帧数组，索引0为黑子，索引1为白子 */
    @property({ type: [cc.SpriteFrame] })
    sptFrames: cc.SpriteFrame[] = [];

    /** 最后落子标记节点 */
    private markerNode: cc.Node | null = null;

    /**
     * 组件加载时调用
     */
    onLoad(): void {
        this.initChess();
    }

    /**
     * 组件销毁时调用
     */
    onDisable(): void {
        super.onDisable();
        if (this.markerNode) {
            this.markerNode.destroy();
            this.markerNode = null;
        }
    }

    /**
     * 初始化棋子
     * 设置默认显示状态
     */
    initChess(): void {
        if (this.sptFrames && this.sptFrames.length > 0) {
            this.getComponent(cc.Sprite).spriteFrame = this.sptFrames[0];
        }
    }

    /**
     * 更新棋子UI显示
     * @param idx - 玩家索引：1表示黑子，2表示白子
     */
    updateUI(idx: number): void {
        if (idx < 1 || idx > this.sptFrames.length) {
            cc.error('无效的棋子索引: ', idx);
            return;
        }
        this.getComponent(cc.Sprite).spriteFrame = this.sptFrames[idx - 1];
    }

    /**
     * 设置棋子透明度（用于预览棋子）
     * @param opacity - 透明度值（0-255）
     */
    setOpacity(opacity: number): void {
        this.node.opacity = opacity;
    }

    /**
     * 获取当前棋子类型
     * @returns 玩家索引：1表示黑子，2表示白子，0表示未知
     */
    getChessType(): number {
        const currentSpriteFrame = this.getComponent(cc.Sprite).spriteFrame;
        for (let i = 0; i < this.sptFrames.length; i++) {
            if (this.sptFrames[i] === currentSpriteFrame) {
                return i + 1;
            }
        }
        return 0;
    }

    /**
     * 播放落子动画
     * 棋子从缩小状态弹跳到正常大小，带有生动的弹性效果
     * @param callback - 动画完成后的回调函数（可选）
     */
    playPlaceAnimation(callback?: () => void): void {
        this.node.setScale(0);

        const jump1 = cc.scaleTo(0.15, 1.0).easing(cc.easeBackOut());
        const jump2 = cc.scaleTo(0.08, 0.88).easing(cc.easeIn(2));
        const jump3 = cc.scaleTo(0.06, 1.05).easing(cc.easeOut(2));
        const jump4 = cc.scaleTo(0.05, 1.0).easing(cc.easeOut(1));

        let action = cc.sequence(jump1, jump2, jump3, jump4);

        if (callback) {
            action = cc.sequence(action, cc.callFunc(callback));
        }

        this.node.runAction(action);
    }

    /**
     * 显示最后落子标记
     * 性能优化：标记节点只创建一次，后续通过active切换
     */
    showLastMoveMarker(): void {
        if (!this.markerNode) {
            this.markerNode = new cc.Node('LastMoveMarker');
            this.markerNode.parent = this.node;

            const graphics = this.markerNode.addComponent(cc.Graphics);
            graphics.fillColor = cc.Color.RED;
            graphics.circle(0, 0, 8);
            graphics.fill();

            this.markerNode.setPosition(0, 0);
        }

        this.markerNode.active = true;
    }

    /**
     * 隐藏最后落子标记
     * 性能优化：只隐藏节点，不销毁
     */
    hideLastMoveMarker(): void {
        if (this.markerNode) {
            this.markerNode.active = false;
        }
    }

    /**
     * 重置棋子状态（用于对象池复用）
     * 在从对象池取出棋子时调用，重置所有状态
     */
    reset(): void {
        this.node.stopAllActions();
        this.node.setScale(1);
        this.node.opacity = 255;
        this.hideLastMoveMarker();
        this.resetShadow();
        this.node.active = true;
    }

    /**
     * 重置阴影节点状态
     * 阴影节点是棋子的子节点，需要单独重置
     */
    private resetShadow(): void {
        const shadowNode = this.node.getChildByName('Shadow');
        if (shadowNode) {
            shadowNode.opacity = 180;
            shadowNode.setPosition(0, -8);
            shadowNode.setScale(1);
            shadowNode.stopAllActions();
            shadowNode.active = true;
        }
    }
}