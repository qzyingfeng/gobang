import GameConfig from '../config/GameConfig';

/**
 * ReplayManager - 游戏回放管理器
 * 负责控制回放流程：播放、暂停、快进、后退、跳转
 */

class ReplayManagerClass {
    /** 单例实例 */
    private static _instance: ReplayManagerClass | null = null;
    /** 回放状态 */
    private state: string = GameConfig.REPLAY.MODE.STOPPED;
    /** 落子历史数据 */
    private moveHistory: { x: number; y: number; playerIdx: number }[] = [];
    /** 棋盘快照数据 */
    private boardSnapshots: any[] = [];
    /** 当前回放步数索引 */
    private currentStep: number = 0;
    /** 总步数 */
    private totalSteps: number = 0;
    /** 播放速度（毫秒/步） */
    private speed: number = GameConfig.REPLAY.DEFAULT_SPEED;
    /** 定时器ID */
    private timerId: any = null;
    /** Battle脚本引用 */
    private battleScript: any = null;
    /** UI更新回调 */
    private onProgressUpdate: ((progress: any) => void) | null = null;
    /** 状态变化回调 */
    private onStateChange: ((state: string) => void) | null = null;

    private constructor() {}

    /**
     * 获取单例实例
     */
    static getInstance(): ReplayManagerClass {
        if (!this._instance) {
            this._instance = new ReplayManagerClass();
        }
        return this._instance;
    }

    /**
     * 初始化回放管理器
     */
    init(
        moveHistory: { x: number; y: number; playerIdx: number }[],
        battleScript: any,
        callbacks: { onProgressUpdate?: (progress: any) => void; onStateChange?: (state: string) => void },
        boardSnapshots?: any[]
    ): void {
        this.moveHistory = moveHistory.map(move => ({
            x: move.x,
            y: move.y,
            playerIdx: move.playerIdx,
        }));
        this.boardSnapshots = boardSnapshots || [];
        this.battleScript = battleScript;
        this.totalSteps = this.moveHistory.length;
        this.currentStep = 0;
        this.state = GameConfig.REPLAY.MODE.STOPPED;
        this.speed = GameConfig.REPLAY.DEFAULT_SPEED;

        if (callbacks) {
            this.onProgressUpdate = callbacks.onProgressUpdate || null;
            this.onStateChange = callbacks.onStateChange || null;
        }

        cc.log('回放管理器初始化完成，总步数:', this.totalSteps);
    }

    /**
     * 开始回放
     */
    start(): void {
        if (this.totalSteps === 0) {
            cc.warn('没有可回放的记录');
            return;
        }

        if (this.currentStep >= this.totalSteps) {
            this.reset();
        }

        this.setState(GameConfig.REPLAY.MODE.PLAYING);
        this.scheduleNextStep();
    }

    /**
     * 暂停回放
     */
    pause(): void {
        if (this.state !== GameConfig.REPLAY.MODE.PLAYING) {
            return;
        }

        this.clearTimer();
        this.setState(GameConfig.REPLAY.MODE.PAUSED);
        cc.log('回放已暂停，当前步数:', this.currentStep);
    }

    /**
     * 继续回放
     */
    resume(): void {
        if (this.state !== GameConfig.REPLAY.MODE.PAUSED) {
            return;
        }

        this.setState(GameConfig.REPLAY.MODE.PLAYING);
        this.scheduleNextStep();
        cc.log('回放已继续');
    }

    /**
     * 停止回放
     */
    stop(): void {
        this.clearTimer();
        this.setState(GameConfig.REPLAY.MODE.STOPPED);
        cc.log('回放已停止');
    }

    /**
     * 重置回放
     */
    reset(): void {
        this.clearTimer();
        this.currentStep = 0;
        this.setState(GameConfig.REPLAY.MODE.STOPPED);

        if (this.battleScript && this.battleScript.clearBoardForReplay) {
            this.battleScript.clearBoardForReplay();
        }

        this.notifyProgressUpdate();
    }

    /**
     * 前进一步
     */
    stepForward(): void {
        if (this.currentStep >= this.totalSteps) {
            return;
        }

        this.playStep(this.currentStep);
        this.currentStep++;
        this.notifyProgressUpdate();

        if (this.currentStep >= this.totalSteps) {
            this.setState(GameConfig.REPLAY.MODE.STOPPED);
            cc.log('回放播放完毕');
        }
    }

    /**
     * 后退一步
     */
    stepBackward(): void {
        if (this.currentStep <= 0) {
            return;
        }

        this.currentStep--;
        this.replayToStep(this.currentStep);
        this.notifyProgressUpdate();
    }

    /**
     * 跳转到指定步数
     */
    jumpToStep(step: number): void {
        if (step < 0 || step > this.totalSteps) {
            return;
        }

        this.currentStep = step;
        this.replayToStep(step);
        this.notifyProgressUpdate();
    }

    /**
     * 设置播放速度
     */
    setSpeed(speed: number): void {
        this.speed = speed;
        cc.log('回放速度设置为:', speed, 'ms/步');

        if (this.state === GameConfig.REPLAY.MODE.PLAYING) {
            this.clearTimer();
            this.scheduleNextStep();
        }
    }

    /**
     * 切换播放/暂停状态
     */
    togglePlayPause(): void {
        if (this.state === GameConfig.REPLAY.MODE.PLAYING) {
            this.pause();
        } else if (this.state === GameConfig.REPLAY.MODE.PAUSED) {
            this.resume();
        } else {
            this.start();
        }
    }

    /**
     * 获取当前状态
     */
    getState(): string {
        return this.state;
    }

    /**
     * 获取当前进度信息
     */
    getProgress(): { currentStep: number; totalSteps: number; speed: number; state: string } {
        return {
            currentStep: this.currentStep,
            totalSteps: this.totalSteps,
            speed: this.speed,
            state: this.state,
        };
    }

    /**
     * 是否正在回放中
     */
    isReplaying(): boolean {
        return this.state !== GameConfig.REPLAY.MODE.STOPPED;
    }

    // 私有方法

    private setState(state: string): void {
        this.state = state;
        if (this.onStateChange) {
            this.onStateChange(state);
        }
    }

    private notifyProgressUpdate(): void {
        if (this.onProgressUpdate) {
            this.onProgressUpdate(this.getProgress());
        }
    }

    private scheduleNextStep(): void {
        this.timerId = setTimeout(() => {
            if (this.state !== GameConfig.REPLAY.MODE.PLAYING) {
                return;
            }

            if (this.currentStep >= this.totalSteps) {
                this.setState(GameConfig.REPLAY.MODE.STOPPED);
                cc.log('回放播放完毕');
                return;
            }

            this.playStep(this.currentStep);
            this.currentStep++;
            this.notifyProgressUpdate();

            this.scheduleNextStep();
        }, this.speed);
    }

    private playStep(stepIndex: number): void {
        if (stepIndex < 0 || stepIndex >= this.totalSteps) {
            return;
        }

        const move = this.moveHistory[stepIndex];
        if (this.battleScript && this.battleScript.replayPlaceChess) {
            this.battleScript.replayPlaceChess(move.x, move.y, move.playerIdx);
        }

        cc.log('回放第', stepIndex + 1, '步: (', move.x, ',', move.y, ') 玩家:', move.playerIdx);
    }

    private replayToStep(targetStep: number): void {
        if (this.battleScript && this.battleScript.clearBoardForReplay) {
            this.battleScript.clearBoardForReplay();
        }

        if (targetStep === 0) {
            return;
        }

        if (this.boardSnapshots.length >= targetStep &&
            this.battleScript &&
            this.battleScript.restoreFromSnapshot) {
            const snapshot = this.boardSnapshots[targetStep - 1];
            this.battleScript.restoreFromSnapshot(snapshot);
            cc.log('使用快照恢复到第', targetStep, '步');
        } else {
            cc.warn('快照不可用，从头播放到第', targetStep, '步');
            for (let i = 0; i < targetStep; i++) {
                this.playStep(i);
            }
        }
    }

    private clearTimer(): void {
        if (this.timerId !== null) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }
}

export default ReplayManagerClass;