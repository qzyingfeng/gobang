/**
 * 游戏信息面板管理器
 * 显示：回合数、游戏用时、当前玩家、悔棋次数
 */

cc.Class({
    extends: cc.Component,

    properties: {
        // UI组件引用（在编辑器中绑定）
        turnLabel: cc.Label,        // 回合数显示
        timeLabel: cc.Label,        // 用时显示
        undoCountLabel: cc.Label,   // 悔棋次数显示
    },

    onLoad() {
        // 初始化状态
        this.turnCount = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.undoCount = 0;
        this.isTimerRunning = false;
    },

    start() {
        // 开始计时
        this.startTimer();
        // 初始化显示
        this.updateAllDisplay();
    },

    update(dt) {
        // 更新计时器显示
        if (this.isTimerRunning) {
            this.elapsedTime += dt;
            this.updateTimeDisplay();
        }
    },

    /**
     * 开始计时
     */
    startTimer() {
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.isTimerRunning = true;
    },

    /**
     * 停止计时
     */
    stopTimer() {
        this.isTimerRunning = false;
    },

    /**
     * 暂停计时
     */
    pauseTimer() {
        this.isTimerRunning = false;
    },

    /**
     * 恢复计时
     */
    resumeTimer() {
        this.isTimerRunning = true;
    },

    /**
     * 重置信息面板
     */
    reset() {
        this.turnCount = 0;
        this.undoCount = 0;
        this.elapsedTime = 0;
        this.startTime = Date.now();
        this.isTimerRunning = true;
        
        this.updateAllDisplay();
    },

    /**
     * 增加回合数
     */
    incrementTurn() {
        this.turnCount++;
        this.updateTurnDisplay();
    },

    /**
     * 增加悔棋次数
     */
    incrementUndoCount() {
        this.undoCount++;
        this.updateUndoCountDisplay();
    },

    /**
     * 更新回合数显示
     */
    updateTurnDisplay() {
        if (this.turnLabel) {
            this.turnLabel.string = "回合: " + this.turnCount;
        }
    },

    /**
     * 更新用时显示
     */
    updateTimeDisplay() {
        if (this.timeLabel) {
            var minutes = Math.floor(this.elapsedTime / 60);
            var seconds = Math.floor(this.elapsedTime % 60);
            var timeStr = this._padZero(minutes) + ":" + this._padZero(seconds);
            this.timeLabel.string = "用时: " + timeStr;
        }
    },

    /**
     * 更新悔棋次数显示
     */
    updateUndoCountDisplay() {
        if (this.undoCountLabel) {
            this.undoCountLabel.string = "悔棋: " + this.undoCount + "次";
        }
    },

    /**
     * 更新所有显示
     */
    updateAllDisplay() {
        this.updateTurnDisplay();
        this.updateTimeDisplay();
        this.updateUndoCountDisplay();
    },

    /**
     * 数字补零
     * @param {number} num - 数字
     * @returns {string} 补零后的字符串
     */
    _padZero: function(num) {
        return num < 10 ? "0" + num : "" + num;
    },

    /**
     * 获取游戏统计信息
     * @returns {Object} 统计信息
     */
    getStats: function() {
        return {
            turnCount: this.turnCount,
            elapsedTime: this.elapsedTime,
            undoCount: this.undoCount,
        };
    },
});