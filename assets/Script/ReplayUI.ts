/**
 * ReplayUI - 回放控制UI面板
 * 负责显示回放控制按钮和进度信息
 * 
 * 功能说明：
 * - 播放/暂停切换：控制回放动画的播放与暂停
 * - 前进/后退一步：逐步查看棋局历史
 * - 速度调节（0.5x/1x/2x/4x）：控制回放动画速度
 * - 进度显示：显示当前步数/总步数（如 "15 / 30"）
 * - 退出回放：关闭回放界面并返回游戏
 * 
 * 使用方式：
 * - 通过 Battle 脚本调用 show() 显示面板
 * - 通过 updateProgress() 更新进度信息
 * - 通过 hide() 隐藏面板
 * 
 * 依赖：
 * - BaseUI：基础UI类，提供 UIManager/AudioManager/ReplayManager 等管理器
 * - GameConfig：游戏配置，包含回放相关常量
 * - Battle：父级战斗脚本，提供回放控制方法
 */

import BaseUI from './base/BaseUI';
import GameConfig from './config/GameConfig';
import EventConst from './config/EventConst';

const { ccclass, property } = cc._decorator;

/**
 * 速度选项配置
 * 用于定义回放速度的选择项
 */
interface SpeedOption {
    label: string;      // 显示文本（如 "1x"）
    value: number;      // 速度数值
}

/**
 * 回放进度信息
 * 用于传递当前回放状态给UI
 */
interface Progress {
    currentStep: number;    // 当前步数（从0开始）
    totalSteps: number;     // 总步数
    speed: number;          // 当前速度
    state: string;          // 当前状态（播放/暂停）
}

/**
 * ReplayUI - 回放控制UI面板类
 * 继承自 BaseUI，负责回放界面的所有交互控制
 */
@ccclass
export default class ReplayUI extends BaseUI {
    /**
     * 播放/暂停按钮
     * 用于切换回放的播放状态
     */
    @property({ type: cc.Button })
    private playPauseButton: cc.Button = null;

    /**
     * 后退一步按钮
     * 用于回退到上一步棋局
     */
    @property({ type: cc.Button })
    private stepBackButton: cc.Button = null;

    /**
     * 前进一步按钮
     * 用于前进到下一步棋局
     */
    @property({ type: cc.Button })
    private stepForwardButton: cc.Button = null;

    /**
     * 速度调节按钮
     * 用于切换回放速度（循环切换）
     */
    @property({ type: cc.Button })
    private speedButton: cc.Button = null;

    /**
     * 退出回放按钮
     * 用于关闭回放界面
     */
    @property({ type: cc.Button })
    private exitButton: cc.Button = null;

    /**
     * 进度文本标签
     * 显示当前步数/总步数（如 "5 / 20"）
     */
    @property({ type: cc.Label })
    private progressLabel: cc.Label = null;

    /**
     * 速度文本标签
     * 显示当前选中速度（如 "1x"）
     */
    @property({ type: cc.Label })
    private speedLabel: cc.Label = null;

    /**
     * 播放/暂停状态文本标签
     * 显示当前是"播放"还是"暂停"
     */
    @property({ type: cc.Label })
    private playPauseLabel: cc.Label = null;

    /**
     * 面板节点引用
     * 用于控制面板的显示/隐藏，若未设置则默认为当前节点
     */
    @property({ type: cc.Node })
    private panelNode: cc.Node = null;

    /**
     * 当前速度选项索引
     * 范围 0-3，对应 speedOptions 数组
     * 初始值为 1（对应 "1x" 正常速度）
     */
    private currentSpeedIndex: number = 1;

    /**
     * 速度选项配置数组
     * 按顺序包含：慢速(0.5x)、正常(1x)、快速(2x)、极快(4x)
     */
    private speedOptions: SpeedOption[] = [
        { label: "0.5x", value: GameConfig.REPLAY.SPEED.SLOW },
        { label: "1x", value: GameConfig.REPLAY.SPEED.NORMAL },
        { label: "2x", value: GameConfig.REPLAY.SPEED.FAST },
        { label: "4x", value: GameConfig.REPLAY.SPEED.VERY_FAST },
    ];

    /**
     * 组件加载回调
     * 在组件首次加载时调用，用于初始化数据
     * 若未设置 panelNode，则使用当前节点作为默认面板
     */
    onLoad() {
        if (!this.panelNode) {
            this.panelNode = this.node;
        }
    }

    /**
     * 场景开始回调
     * 在组件首次激活时调用，用于绑定事件和初始化UI状态
     * super.start()：调用父类 start 方法，初始化管理器
     */
    start() {
        this.updateSpeedLabel();
        this.panelNode.active = false;
    }

    /**
     * 组件销毁回调
     * 在组件销毁时调用，用于清理事件监听器和资源
     * 先解绑按钮事件，再调用父类销毁方法确保正确清理
     */
    onDisable() {
        super.onDisable();
        this.unbindButtonEvents();
        this.EventEmitter.off(EventConst.ON_REPLAY_STATE, this.updatePlayPauseButton, this);
    }

    onEnable() {
        this.initEvent();
        this.EventEmitter.on(EventConst.ON_REPLAY_STATE, this.updatePlayPauseButton, this);
    }

    /**
     * 初始化事件监听
     * 重写父类方法，用于注册自定义事件
     * 当前实现为空，保留扩展性
     */
    protected initEvent(): void {
        super.initEvent();
        this.bindButtonEvents();
    }

    /**
     * 绑定所有按钮事件
     * 一次性绑定所有控制按钮的点击事件
     */
    private bindButtonEvents(): void {
        if (this.playPauseButton) {
            this.playPauseButton.node.on(cc.Node.EventType.TOUCH_START, this.onPlayPauseClick, this);
        }
        if (this.stepBackButton) {
            this.stepBackButton.node.on(cc.Node.EventType.TOUCH_START, this.onStepBackClick, this);
        }
        if (this.stepForwardButton) {
            this.stepForwardButton.node.on(cc.Node.EventType.TOUCH_START, this.onStepForwardClick, this);
        }
        if (this.speedButton) {
            this.speedButton.node.on(cc.Node.EventType.TOUCH_START, this.onSpeedClick, this);
        }
        if (this.exitButton) {
            this.exitButton.node.on(cc.Node.EventType.TOUCH_START, this.onExitClick, this);
        }
    }

    /**
     * 解绑所有按钮事件
     * 在组件销毁时调用，确保不发生内存泄漏
     */
    private unbindButtonEvents(): void {
        if (this.playPauseButton) {
            this.playPauseButton.node.off(cc.Node.EventType.TOUCH_START, this.onPlayPauseClick, this);
        }
        if (this.stepBackButton) {
            this.stepBackButton.node.off(cc.Node.EventType.TOUCH_START, this.onStepBackClick, this);
        }
        if (this.stepForwardButton) {
            this.stepForwardButton.node.off(cc.Node.EventType.TOUCH_START, this.onStepForwardClick, this);
        }
        if (this.speedButton) {
            this.speedButton.node.off(cc.Node.EventType.TOUCH_START, this.onSpeedClick, this);
        }
        if (this.exitButton) {
            this.exitButton.node.off(cc.Node.EventType.TOUCH_START, this.onExitClick, this);
        }
    }

    /**
     * 显示回放控制面板
     * 激活面板节点，初始化播放状态为暂停，播放按钮点击音效
     */
    show(): void {
        if (!this.panelNode) {
            this.panelNode = this.node;
        }

        this.panelNode.active = true;
        this.updatePlayPauseButton(GameConfig.REPLAY.MODE.PAUSED);
        this.AudioManager.play(GameConfig.AUDIO.NAMES.BUTTON_CLICK);
    }

    /**
     * 隐藏回放控制面板
     * 停用面板节点
     */
    hide(): void {
        if (this.panelNode) {
            this.panelNode.active = false;
        }
    }

    /**
     * 更新回放进度显示
     * 根据传入的进度信息更新UI显示
     * @param progress - 包含当前步数、总步数、速度、状态的对象
     */
    updateProgress(progress: Progress): void {
        if (this.progressLabel) {
            this.progressLabel.string = `${progress.currentStep} / ${progress.totalSteps}`;
        }

        this.updatePlayPauseButton(progress.state);
        this.updateButtonStates(progress);
    }

    /**
     * 播放/暂停按钮点击事件处理
     * 播放音效，调用 Battle 脚本的切换播放/暂停方法
     */
    private onPlayPauseClick(): void {
        this.AudioManager.play(GameConfig.AUDIO.NAMES.BUTTON_CLICK);
        this.ReplayManager.togglePlayPause();
    }

    private onStepBackClick(): void {
        this.AudioManager.play(GameConfig.AUDIO.NAMES.BUTTON_CLICK);
        this.ReplayManager.stepBackward();
    }

    private onStepForwardClick(): void {
        this.AudioManager.play(GameConfig.AUDIO.NAMES.BUTTON_CLICK);
        this.ReplayManager.stepForward();
    }

    /**
     * 速度调节按钮点击事件处理
     * 播放音效，循环切换速度选项，更新UI并设置 ReplayManager 的速度
     */
    private onSpeedClick(): void {
        this.AudioManager.play(GameConfig.AUDIO.NAMES.BUTTON_CLICK);

        this.currentSpeedIndex = (this.currentSpeedIndex + 1) % this.speedOptions.length;
        const speed = this.speedOptions[this.currentSpeedIndex].value;

        this.updateSpeedLabel();
        this.ReplayManager.setSpeed(speed);
    }

    /**
     * 退出按钮点击事件处理
     * 播放音效，调用 Battle 脚本的停止回放方法，然后隐藏面板
     */
    private onExitClick(): void {
        this.AudioManager.play(GameConfig.AUDIO.NAMES.BUTTON_CLICK);

        const battleScript = this.getBattleScript();
        if (battleScript) {
            battleScript.stopReplay();
        }

        this.hide();
    }

    private getBattleScript(): any {
        let battleNode = this.node.parent;
        while (battleNode) {
            const battleScript = battleNode.getComponent("BattleLayer");
            if (battleScript) {
                return battleScript;
            }
            battleNode = battleNode.parent;
        }
        return null;
    }

    /**
     * 更新播放/暂停按钮的文本显示
     * 根据当前状态切换显示"播放"或"暂停"
     * @param state - 当前回放状态（PLAYING 或 PAUSED）
     */
    public updatePlayPauseButton(state: string): void {
        if (this.playPauseLabel) {
            if (state === GameConfig.REPLAY.MODE.PLAYING) {
                this.playPauseLabel.string = "暂停";
            } else {
                this.playPauseLabel.string = "播放";
            }
        }
    }

    /**
     * 更新速度标签的文本显示
     * 根据当前选中的速度选项更新显示
     */
    private updateSpeedLabel(): void {
        if (this.speedLabel) {
            this.speedLabel.string = this.speedOptions[this.currentSpeedIndex].label;
        }
    }

    /**
     * 更新按钮的可交互状态
     * 根据当前进度禁用/启用前进/后退按钮
     * @param progress - 包含当前步数和总步数的进度对象
     */
    private updateButtonStates(progress: Progress): void {
        if (this.stepBackButton) {
            this.stepBackButton.interactable = progress.currentStep > 0;
        }

        if (this.stepForwardButton) {
            this.stepForwardButton.interactable = progress.currentStep < progress.totalSteps;
        }
    }
}