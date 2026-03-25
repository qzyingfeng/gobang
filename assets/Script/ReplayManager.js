/**
 * 游戏回放管理器
 * 负责控制回放流程：播放、暂停、快进、后退、跳转
 * 
 * 使用方式：
 * 1. 游戏结束时，Battle.js 调用 ReplayManager.init(moveHistory, battleScript, callbacks, boardSnapshots)
 * 2. 用户点击"查看回放"，调用 ReplayManager.start()
 * 3. 回放过程中，用户可控制播放速度和进度
 * 4. 用户退出回放，调用 ReplayManager.stop()
 */

// GameConfig 为全局变量，无需 require

var ReplayManager = {
    // 回放状态
    _state: GameConfig.REPLAY.MODE.STOPPED,
    
    // 落子历史数据
    _moveHistory: [],
    
    // 棋盘快照数据（用于快速跳转）
    _boardSnapshots: [],
    
    // 当前回放步数索引（0表示未开始）
    _currentStep: 0,
    
    // 总步数
    _totalSteps: 0,
    
    // 播放速度（毫秒/步）
    _speed: GameConfig.REPLAY.DEFAULT_SPEED,
    
    // 定时器ID
    _timerId: null,
    
    // Battle脚本引用（用于调用落子方法）
    _battleScript: null,
    
    // UI更新回调
    _onProgressUpdate: null,
    
    // 状态变化回调
    _onStateChange: null,
    
    /**
     * 初始化回放管理器
     * @param {Array} moveHistory - 落子历史数组
     * @param {Object} battleScript - Battle脚本实例
     * @param {Object} callbacks - 回调函数 {onProgressUpdate, onStateChange}
     * @param {Array} boardSnapshots - 棋盘快照数组（用于快速跳转）
     */
    init: function(moveHistory, battleScript, callbacks, boardSnapshots) {
        // 保存落子历史（深拷贝，避免修改原始数据）
        this._moveHistory = [];
        for (var i = 0; i < moveHistory.length; i++) {
            this._moveHistory.push({
                x: moveHistory[i].x,
                y: moveHistory[i].y,
                playerIdx: moveHistory[i].playerIdx,
            });
        }
        
        // 保存棋盘快照引用（用于快速跳转）
        this._boardSnapshots = boardSnapshots || [];
        
        this._battleScript = battleScript;
        this._totalSteps = this._moveHistory.length;
        this._currentStep = 0;
        this._state = GameConfig.REPLAY.MODE.STOPPED;
        this._speed = GameConfig.REPLAY.DEFAULT_SPEED;
        
        // 设置回调
        if (callbacks) {
            this._onProgressUpdate = callbacks.onProgressUpdate || null;
            this._onStateChange = callbacks.onStateChange || null;
        }
        
        cc.log("回放管理器初始化完成，总步数:", this._totalSteps, "快照数:", this._boardSnapshots.length);
    },
    
    /**
     * 开始回放
     */
    start: function() {
        if (this._totalSteps === 0) {
            cc.warn("没有可回放的记录");
            return;
        }
        
        // 如果已结束，重新开始
        if (this._currentStep >= this._totalSteps) {
            this.reset();
        }
        
        this._setState(GameConfig.REPLAY.MODE.PLAYING);
        this._scheduleNextStep();
    },
    
    /**
     * 暂停回放
     */
    pause: function() {
        if (this._state !== GameConfig.REPLAY.MODE.PLAYING) {
            return;
        }
        
        this._clearTimer();
        this._setState(GameConfig.REPLAY.MODE.PAUSED);
        
        cc.log("回放已暂停，当前步数:", this._currentStep);
    },
    
    /**
     * 继续回放
     */
    resume: function() {
        if (this._state !== GameConfig.REPLAY.MODE.PAUSED) {
            return;
        }
        
        this._setState(GameConfig.REPLAY.MODE.PLAYING);
        this._scheduleNextStep();
        
        cc.log("回放已继续");
    },
    
    /**
     * 停止回放
     */
    stop: function() {
        this._clearTimer();
        this._setState(GameConfig.REPLAY.MODE.STOPPED);
        
        cc.log("回放已停止");
    },
    
    /**
     * 重置回放（回到开头）
     */
    reset: function() {
        this._clearTimer();
        this._currentStep = 0;
        this._setState(GameConfig.REPLAY.MODE.STOPPED);
        
        // 清空棋盘
        if (this._battleScript && this._battleScript.clearBoardForReplay) {
            this._battleScript.clearBoardForReplay();
        }
        
        // 通知UI更新
        this._notifyProgressUpdate();
    },
    
    /**
     * 前进一步
     */
    stepForward: function() {
        if (this._currentStep >= this._totalSteps) {
            return;
        }
        
        this._playStep(this._currentStep);
        this._currentStep++;
        this._notifyProgressUpdate();
        
        // 检查是否播放完毕
        if (this._currentStep >= this._totalSteps) {
            this._setState(GameConfig.REPLAY.MODE.STOPPED);
            cc.log("回放播放完毕");
        }
    },
    
    /**
     * 后退一步（使用快照优化，O(1)复杂度）
     */
    stepBackward: function() {
        if (this._currentStep <= 0) {
            return;
        }
        
        this._currentStep--;
        this._replayToStep(this._currentStep);
        this._notifyProgressUpdate();
    },
    
    /**
     * 跳转到指定步数
     * @param {number} step - 目标步数（0-based）
     */
    jumpToStep: function(step) {
        if (step < 0 || step > this._totalSteps) {
            return;
        }
        
        this._currentStep = step;
        this._replayToStep(step);
        this._notifyProgressUpdate();
    },
    
    /**
     * 设置播放速度
     * @param {number} speed - 播放速度（毫秒/步）
     */
    setSpeed: function(speed) {
        this._speed = speed;
        cc.log("回放速度设置为:", speed, "ms/步");
        
        // 如果正在播放，重启定时器以应用新速度
        if (this._state === GameConfig.REPLAY.MODE.PLAYING) {
            this._clearTimer();
            this._scheduleNextStep();
        }
    },
    
    /**
     * 切换播放/暂停状态
     */
    togglePlayPause: function() {
        if (this._state === GameConfig.REPLAY.MODE.PLAYING) {
            this.pause();
        } else if (this._state === GameConfig.REPLAY.MODE.PAUSED) {
            this.resume();
        } else {
            this.start();
        }
    },
    
    /**
     * 获取当前状态
     * @returns {string} 当前状态
     */
    getState: function() {
        return this._state;
    },
    
    /**
     * 获取当前进度信息
     * @returns {Object} 进度信息 {currentStep, totalSteps, speed, state}
     */
    getProgress: function() {
        return {
            currentStep: this._currentStep,
            totalSteps: this._totalSteps,
            speed: this._speed,
            state: this._state,
        };
    },
    
    /**
     * 是否正在回放中
     * @returns {boolean} 是否正在回放
     */
    isReplaying: function() {
        return this._state !== GameConfig.REPLAY.MODE.STOPPED;
    },
    
    // ==================== 私有方法 ====================
    
    /**
     * 设置状态并通知回调
     * @param {string} state - 新状态
     */
    _setState: function(state) {
        this._state = state;
        if (this._onStateChange) {
            this._onStateChange(state);
        }
    },
    
    /**
     * 通知进度更新回调
     */
    _notifyProgressUpdate: function() {
        if (this._onProgressUpdate) {
            this._onProgressUpdate(this.getProgress());
        }
    },
    
    /**
     * 调度下一步播放
     */
    _scheduleNextStep: function() {
        var self = this;
        this._timerId = setTimeout(function() {
            if (self._state !== GameConfig.REPLAY.MODE.PLAYING) {
                return;
            }
            
            if (self._currentStep >= self._totalSteps) {
                self._setState(GameConfig.REPLAY.MODE.STOPPED);
                cc.log("回放播放完毕");
                return;
            }
            
            self._playStep(self._currentStep);
            self._currentStep++;
            self._notifyProgressUpdate();
            
            // 继续下一步
            self._scheduleNextStep();
        }, this._speed);
    },
    
    /**
     * 播放指定步数
     * @param {number} stepIndex - 步数索引
     */
    _playStep: function(stepIndex) {
        if (stepIndex < 0 || stepIndex >= this._totalSteps) {
            return;
        }
        
        var move = this._moveHistory[stepIndex];
        if (this._battleScript && this._battleScript.replayPlaceChess) {
            this._battleScript.replayPlaceChess(move.x, move.y, move.playerIdx);
        }
        
        cc.log("回放第", stepIndex + 1, "步: (", move.x, ",", move.y, ") 玩家:", move.playerIdx);
    },
    
    /**
     * 重放到指定步数（使用快照优化）
     * @param {number} targetStep - 目标步数
     */
    _replayToStep: function(targetStep) {
        // 清空棋盘
        if (this._battleScript && this._battleScript.clearBoardForReplay) {
            this._battleScript.clearBoardForReplay();
        }
        
        // 如果目标步数为0，直接返回
        if (targetStep === 0) {
            return;
        }
        
        // 优先使用快照恢复（O(1)复杂度）
        if (this._boardSnapshots.length >= targetStep && 
            this._battleScript && 
            this._battleScript.restoreFromSnapshot) {
            var snapshot = this._boardSnapshots[targetStep - 1];
            this._battleScript.restoreFromSnapshot(snapshot);
            cc.log("使用快照恢复到第", targetStep, "步");
        } else {
            // 没有快照，回退到从头播放（兼容旧逻辑）
            cc.warn("快照不可用，从头播放到第", targetStep, "步");
            for (var i = 0; i < targetStep; i++) {
                this._playStep(i);
            }
        }
    },
    
    /**
     * 清除定时器
     */
    _clearTimer: function() {
        if (this._timerId !== null) {
            clearTimeout(this._timerId);
            this._timerId = null;
        }
    },
};

// 确保全局可访问
window.ReplayManager = ReplayManager;
