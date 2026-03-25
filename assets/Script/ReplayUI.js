/**
 * 回放控制UI面板
 * 负责显示回放控制按钮和进度信息
 * 
 * 功能：
 * - 播放/暂停切换
 * - 前进/后退一步
 * - 速度调节（慢速/正常/快速/极快）
 * - 进度显示（当前步数/总步数）
 * - 退出回放
 */

// GameConfig 为全局变量，无需 require

cc.Class({
    extends: cc.Component,

    properties: {
        // 控制按钮
        playPauseButton: cc.Button,     // 播放/暂停按钮
        stepBackButton: cc.Button,      // 后退一步按钮
        stepForwardButton: cc.Button,   // 前进一步按钮
        speedButton: cc.Button,         // 速度切换按钮
        exitButton: cc.Button,          // 退出回放按钮
        
        // 显示标签
        progressLabel: cc.Label,        // 进度显示标签（第X步/共Y步）
        speedLabel: cc.Label,           // 速度显示标签
        playPauseLabel: cc.Label,       // 播放/暂停按钮文字
        
        // 面板根节点
        panelNode: cc.Node,
    },

    onLoad() {
        // 初始化状态
        this._currentSpeedIndex = 1;    // 默认正常速度
        this._speedOptions = [
            { label: "0.5x", value: GameConfig.REPLAY.SPEED.SLOW },
            { label: "1x", value: GameConfig.REPLAY.SPEED.NORMAL },
            { label: "2x", value: GameConfig.REPLAY.SPEED.FAST },
            { label: "4x", value: GameConfig.REPLAY.SPEED.VERY_FAST },
        ];
        
        // 如果 panelNode 未绑定，使用当前节点
        if (!this.panelNode) {
            this.panelNode = this.node;
        }
    },

    start() {
        // 绑定按钮事件
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
        
        // 初始化速度显示
        this._updateSpeedLabel();
        
        // 默认隐藏面板
        this.panelNode.active = false;
    },

    onDestroy() {
        // 节点销毁时会自动清理事件监听，无需手动清理
    },

    /**
     * 显示回放控制面板
     */
    show() {
        // 确保 panelNode 存在
        if (!this.panelNode) {
            this.panelNode = this.node;
        }
        
        //显示面板
        this.panelNode.active = true

        // 更新为暂停状态显示
        this._updatePlayPauseButton(GameConfig.REPLAY.MODE.PAUSED);
        
        // 播放按钮点击音效
        AudioManager.play(GameConfig.AUDIO.NAMES.BUTTON_CLICK);
    },

    /**
     * 隐藏回放控制面板
     */
    hide() {
        if (this.panelNode) {
            this.panelNode.active = false;
        }
    },

    /**
     * 更新进度显示
     * @param {Object} progress - 进度信息 {currentStep, totalSteps, speed, state}
     */
    updateProgress(progress) {
        // 更新进度标签
        if (this.progressLabel) {
            this.progressLabel.string = progress.currentStep + " / " + progress.totalSteps;
        }
        
        // 更新播放/暂停按钮状态
        this._updatePlayPauseButton(progress.state);
        
        // 更新按钮可点击状态
        this._updateButtonStates(progress);
    },

    /**
     * 播放/暂停按钮点击事件
     */
    onPlayPauseClick() {
        AudioManager.play(GameConfig.AUDIO.NAMES.BUTTON_CLICK);
        
        // 获取Battle脚本
        var battleScript = this._getBattleScript();
        if (battleScript && battleScript.toggleReplayPlayPause) {
            battleScript.toggleReplayPlayPause();
        }
    },

    /**
     * 后退一步按钮点击事件
     */
    onStepBackClick() {
        AudioManager.play(GameConfig.AUDIO.NAMES.BUTTON_CLICK);
        
        var battleScript = this._getBattleScript();
        if (battleScript && battleScript.replayStepBackward) {
            battleScript.replayStepBackward();
        }
    },

    /**
     * 前进一步按钮点击事件
     */
    onStepForwardClick() {
        AudioManager.play(GameConfig.AUDIO.NAMES.BUTTON_CLICK);
        
        var battleScript = this._getBattleScript();
        if (battleScript && battleScript.replayStepForward) {
            battleScript.replayStepForward();
        }
    },

    /**
     * 速度切换按钮点击事件
     */
    onSpeedClick() {
        AudioManager.play(GameConfig.AUDIO.NAMES.BUTTON_CLICK);
        
        // 切换到下一个速度选项
        this._currentSpeedIndex = (this._currentSpeedIndex + 1) % this._speedOptions.length;
        var speed = this._speedOptions[this._currentSpeedIndex].value;
        
        // 更新速度显示
        this._updateSpeedLabel();
        
        // 设置回放速度
        ReplayManager.setSpeed(speed);
    },

    /**
     * 退出回放按钮点击事件
     */
    onExitClick() {
        AudioManager.play(GameConfig.AUDIO.NAMES.BUTTON_CLICK);
        
        var battleScript = this._getBattleScript();
        if (battleScript && battleScript.stopReplay) {
            battleScript.stopReplay();
        }
        
        // 隐藏面板
        this.hide();
    },

    // ==================== 私有方法 ====================

    /**
     * 获取Battle脚本实例
     * @returns {Object} Battle脚本实例
     */
    _getBattleScript() {
        // 从父节点获取Battle组件
        var battleNode = this.node.parent;
        while (battleNode) {
            var battleScript = battleNode.getComponent("Battle");
            if (battleScript) {
                return battleScript;
            }
            battleNode = battleNode.parent;
        }
        return null;
    },

    /**
     * 更新播放/暂停按钮显示
     * @param {string} state - 回放状态
     */
    _updatePlayPauseButton(state) {
        if (this.playPauseLabel) {
            if (state === GameConfig.REPLAY.MODE.PLAYING) {
                this.playPauseLabel.string = "暂停";
            } else {
                this.playPauseLabel.string = "播放";
            }
        }
    },

    /**
     * 更新速度显示标签
     */
    _updateSpeedLabel() {
        if (this.speedLabel) {
            this.speedLabel.string = this._speedOptions[this._currentSpeedIndex].label;
        }
    },

    /**
     * 更新按钮可点击状态
     * @param {Object} progress - 进度信息
     */
    _updateButtonStates(progress) {
        // 后退按钮：第一步时禁用
        if (this.stepBackButton) {
            this.stepBackButton.interactable = progress.currentStep > 0;
        }
        
        // 前进按钮：最后一步时禁用
        if (this.stepForwardButton) {
            this.stepForwardButton.interactable = progress.currentStep < progress.totalSteps;
        }
    },
});
