/**
 * GameInfoUI - 游戏信息面板UI
 * 显示：回合数、游戏用时、悔棋次数
 * 
 * 功能说明：
 * - 回合数显示与管理
 * - 游戏用时计时器（开始/停止/暂停/恢复）
 * - 悔棋次数显示与管理
 * - 所有信息统一更新
 * 
 * 依赖：
 * - BaseUI：基础UI类
 */

import BaseUI from './base/BaseUI';
import EventConst from './config/EventConst';

const { ccclass, property } = cc._decorator;

/**
 * 游戏统计信息
 * 用于获取游戏过程中的统计数据
 */
interface GameStats {
    turnCount: number;      // 回合数
    elapsedTime: number;  // 已用时间（秒）
    undoCount: number;    // 悔棋次数
}

@ccclass
export default class GameInfoUI extends BaseUI {
    /** 回合数显示标签 */
    @property({ type: cc.Label })
    private turnLabel: cc.Label = null;

    /** 用时显示标签 */
    @property({ type: cc.Label })
    private timeLabel: cc.Label = null;

    /** 悔棋次数显示标签 */
    @property({ type: cc.Label })
    private undoCountLabel: cc.Label = null;

    /** 回合数 */
    private turnCount: number = 0;

    /** 开始时间戳 */
    private startTime: number = 0;

    /** 已用时间（秒） */
    private elapsedTime: number = 0;

    /** 悔棋次数 */
    private undoCount: number = 0;

    /** 计时器是否运行中 */
    private isTimerRunning: boolean = false;

    onLoad() {
        this.turnCount = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.undoCount = 0;
        this.isTimerRunning = false;
    }

    onEnable() {
        this.EventEmitter.on(EventConst.ON_UNDO, this.incrementUndoCount, this);
        this.EventEmitter.on(EventConst.ON_TURN, this.incrementTurn, this);
    }

    onDisable() {
        this.EventEmitter.off(EventConst.ON_UNDO, this.incrementUndoCount, this);
        this.EventEmitter.off(EventConst.ON_TURN, this.incrementTurn, this);
    }

    start() {
        this.startTimer();
        this.updateAllDisplay();
    }

    update(dt: number) {
        if (this.isTimerRunning) {
            this.elapsedTime += dt;
            this.updateTimeDisplay();
        }
    }

    /**
     * 开始计时
     */
    startTimer(): void {
        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.isTimerRunning = true;
    }

    /**
     * 停止计时
     */
    stopTimer(): void {
        this.isTimerRunning = false;
    }

    /**
     * 暂停计时
     */
    pauseTimer(): void {
        this.isTimerRunning = false;
    }

    /**
     * 恢复计时
     */
    resumeTimer(): void {
        this.isTimerRunning = true;
    }

    /**
     * 重置信息面板
     */
    reset(): void {
        this.turnCount = 0;
        this.undoCount = 0;
        this.elapsedTime = 0;
        this.startTime = Date.now();
        this.isTimerRunning = true;
        
        this.updateAllDisplay();
    }

    /**
     * 增加回合数
     */
    incrementTurn(): void {
        this.turnCount++;
        this.updateTurnDisplay();
    }

    /**
     * 增加悔棋次数
     */
    incrementUndoCount(): void {
        this.undoCount++;
        this.updateUndoCountDisplay();
    }

    /**
     * 更新回合数显示
     */
    private updateTurnDisplay(): void {
        if (this.turnLabel) {
            this.turnLabel.string = `回合: ${this.turnCount}`;
        }
    }

    /**
     * 更新用时显示
     */
    private updateTimeDisplay(): void {
        if (this.timeLabel) {
            const minutes = Math.floor(this.elapsedTime / 60);
            const seconds = Math.floor(this.elapsedTime % 60);
            const timeStr = `${this._padZero(minutes)}:${this._padZero(seconds)}`;
            this.timeLabel.string = `用时: ${timeStr}`;
        }
    }

    /**
     * 更新悔棋次数显示
     */
    private updateUndoCountDisplay(): void {
        if (this.undoCountLabel) {
            this.undoCountLabel.string = `悔棋: ${this.undoCount}次`;
        }
    }

    /**
     * 更新所有显示
     */
    updateAllDisplay(): void {
        this.updateTurnDisplay();
        this.updateTimeDisplay();
        this.updateUndoCountDisplay();
    }

    /**
     * 数字补零
     * @param num - 数字
     * @returns 补零后的字符串
     */
    private _padZero(num: number): string {
        return num < 10 ? `0${num}` : `${num}`;
    }

    /**
     * 获取游戏统计信息
     * @returns 统计信息对象
     */
    getStats(): GameStats {
        return {
            turnCount: this.turnCount,
            elapsedTime: this.elapsedTime,
            undoCount: this.undoCount,
        };
    }
}