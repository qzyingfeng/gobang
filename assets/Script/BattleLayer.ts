/**
 * BattleLayer - 对战界面
 * 继承 BasePage 实现五子棋对战功能
 * 
 * 核心功能：
 * 1. 落子系统：玩家点击棋盘落子，支持预览、对象池管理
 * 2. 胜负判定：四方向检查五子连珠（横、竖、斜、反斜）
 * 3. AI对战：PVE模式下AI自动计算最佳落子位置
 * 4. 悔棋功能：支持撤销上一步或上两步（ PvE模式下）
 * 5. 回放系统：游戏结束后可回放整局棋谱
 * 6. 连线动画：胜利时绘制五子连线高亮
 * 
 * 游戏流程：
 * 1. 初始化棋盘map、棋子对象池、胜利连线graphics
 * 2. 玩家点击棋盘 -> 显示落子预览 -> 确认落子
 * 3. 检查是否获胜 -> 绘制胜利连线 -> 显示胜利弹窗
 * 4. 切换玩家 -> 重复步骤2-3
 * 5. 游戏结束可选择回放或重新开始
 */

import BasePage from './base/BasePage';
import { Broadcast } from './utils/BroadcastDecorator';
import EventConst from './config/EventConst';
// eslint-disable-next-line @typescript-eslint/no-var-requires
import GameConfig from './config/GameConfig';
import GameInfoUI from './GameInfoUI';

/**
 * 落子记录结构
 * 用于记录每一步棋的位置、玩家和棋子节点
 */
interface MoveRecord {
    x: number;          // 棋盘X坐标（列）
    y: number;          // 棋盘Y坐标（行）
    playerIdx: number;  // 玩家索引：1=黑方，2=白方
    chessNode: cc.Node; // 棋子节点引用
}

/**
 * 棋盘坐标结构
 * 表示棋盘上的一个交叉点位置
 */
interface ChessPosition {
    x: number;  // 棋盘X坐标（列）
    y: number;  // 棋盘Y坐标（行）
}

const { ccclass, property } = cc._decorator;

@ccclass
export default class BattleLayer extends BasePage {
    /** 棋子预制体 */
    @property({ type: cc.Prefab })
    pfchess: cc.Prefab = null!;

    /** 棋盘基准节点（棋盘左下角坐标参考点） */
    @property({ type: cc.Node })
    ndBase: cc.Node = null!;

    /** 棋子宽度（像素） */
    @property
    chessWidth: number = 35;

    /** 棋子高度（像素） */
    @property
    chessHeight: number = 35;

    /** 棋盘宽度（列数） */
    @property
    mapWidth: number = 15;

    /** 棋盘高度（行数） */
    @property
    mapHeight: number = 15;

    /** 当前玩家显示文本 */
    @property({ type: cc.Label })
    textPlayer: cc.Label = null!;

    /** AI思考中提示标签 */
    @property({ type: cc.Label })
    aiThinkingLabel: cc.Label = null!;

    /** 悔棋按钮 */
    @property({ type: cc.Button })
    undoButton: cc.Button = null!;

    /** 返回按钮 */
    @property({ type: cc.Button })
    btnReturn: cc.Button = null!;

    /** 棋盘背景节点（用于接收触摸事件） */
    @property({ type: cc.Node })
    ndMapBG: cc.Node = null!;

    /** 回放UI节点 */
    @property({ type: cc.Node })
    replayUINode: cc.Node = null!;

    /** 回放进度显示标签 */
    @property({ type: cc.Label })
    replayProgressLabel: cc.Label = null!;

    /** 游戏信息面板脚本 */
    @property({ type:GameInfoUI })
    private gameInfoUI: any = null;

    /** 当前玩家索引：1=黑方，2=白方 */
    private playerIdx: number = 1;

    /** 游戏是否已结束 */
    private gameOver: boolean = false;

    /** 是否正在显示弹窗（阻止交互） */
    private isPopupShowing: boolean = false;

    /** AI是否正在思考（阻止玩家操作） */
    private isAIThinking: boolean = false;

    /** 游戏模式：'pvp'=双人对战，'pve'=人机对战 */
    private gameMode: string = 'pvp';

    /** 当前预览位置（待确认落子点） */
    private previewPosition: ChessPosition | null = null;

    /** 预览棋子节点（半透明显示） */
    private previewChessNode: cc.Node | null = null;

    /** 最后落子的棋子节点（用于显示最后一步标记） */
    private lastChessNode: cc.Node | null = null;

    /** 落子历���记录（用于悔棋和回放） */
    private moveHistory: MoveRecord[] = [];

    /** 是否正在执行悔棋操作 */
    private isUndoing: boolean = false;

    /** 是否处于回放模式 */
    private isReplayMode: boolean = false;

    /** 棋盘状态二维数组：0=空，1=黑子，2=白子 */
    private map: number[][] = [];

    /** 棋子对象池（复用棋子节点，减少GC） */
    private chessPool: cc.NodePool = null!;

    /** 棋盘快照列表（用于回放时的状态恢复） */
    private boardSnapshots: number[][][] = [];

    /** 胜利连线图形节点 */
    private graphicsLineNode: cc.Node | null = null;

    /** 胜利连线Graphics组件 */
    private graphicsLine: cc.Graphics | null = null;

    /**
     * 初始化视图
     * 重写父类方法，初始化游戏所需的核心组件和数据
     * 调用super.initView()确保父类基础初始化完成
     */
    protected initView(): void {
        super.initView(); // 【super调用】确保父类的基础视图初始化完成
        this.initMap();               // 初始化空棋盘
        this.initChessPool();         // 初始化棋子对象池
        this.initWinLineGraphics();   // 初始化胜利连线绘制组件
        this.loadGameMode();          // 加载游戏模式设置
    }

    /**
     * 初始化事件监听
     * 重写父类方法，注册本界面所需的事件
     * 调用super.initEvent()确保父类事件监听完成
     */
    protected initEvent(): void {
        super.initEvent(); // 【super调用】确保父类事件监听初始化完成
        this.ndMapBG.on(cc.Node.EventType.TOUCH_START, this.touchBegan, this);
        this.undoButton.node.on(cc.Node.EventType.TOUCH_START, this.onUndoClick, this);
        this.btnReturn.node.on(cc.Node.EventType.TOUCH_START, this.onReturn, this);
    }

    onDisable() {
        this.ndMapBG.off(cc.Node.EventType.TOUCH_START, this.touchBegan, this);
        this.undoButton.node.off(cc.Node.EventType.TOUCH_START, this.onUndoClick, this);
        this.btnReturn.node.off(cc.Node.EventType.TOUCH_START, this.onReturn, this);
        super.onDisable();
    }

    /**
     * 界面显示时触发
     * @param data - 传入的初始化数据（可选）
     */
    onShow(data?: any): void {
        super.onShow(data); // 【super调用】确保父类显示逻辑执行
        this.AudioManager.playMusic('bgm_battle', true);
        this.updatePlayerText();
    }

    /**
     * 初始化棋盘map
     * 创建二维数组表示棋盘状态，0表示空位
     */
    private initMap(): void {
        this.map = [];
        for (let i = 0; i < this.mapHeight; i++) {
            this.map[i] = [];
            for (let j = 0; j < this.mapWidth; j++) {
                this.map[i][j] = 0;
            }
        }
    }

    /**
     * 初始化棋子对象池
     * 预生成指定数量的棋子节点，复用减少性能开销
     */
    private initChessPool(): void {
        this.chessPool = new cc.NodePool('Chess');
        const poolSize = GameConfig.CHESS.POOL_SIZE || 30;
        for (let i = 0; i < poolSize; i++) {
            const chessNode = cc.instantiate(this.pfchess);
            this.chessPool.put(chessNode);
        }
        this.ResourceManager.register('BattleLayer', [this.pfchess]);
    }

    /**
      * 初始化胜利连线Graphics组件
      * 用于绘制五子连珠时的高亮连线效果
      */
    private initWinLineGraphics(): void {
        this.graphicsLineNode = new cc.Node('WinLineGraphics');
        this.graphicsLineNode.parent = this.node;
        this.graphicsLineNode.setPosition(0, 0);
        this.graphicsLine = this.graphicsLineNode.addComponent(cc.Graphics);
        this.graphicsLineNode.active = false;
        this.graphicsLineNode.zIndex = 55;
    }

    /**
     * 加载游戏模式设置
     * 从本地存储读取游戏模式和人机难度设置
     */
    private loadGameMode(): void {
        this.gameMode = cc.sys.localStorage.getItem('gameMode') || 'pvp';
        if (this.gameMode === 'pve') {
            const difficulty = this.SettingManager.getAIDifficulty();
            this.AI.setDifficulty(difficulty);
        }
        if (this.aiThinkingLabel) {
            this.aiThinkingLabel.node.active = false;
        }
    }

    /**
     * 将棋盘坐标转换为世界坐标，再转成battleLayer本地坐标
     * @param ipos - 棋盘坐标 {x, y}
     * @returns battleLayer 本地坐标
     */
    private getChessPosition(ipos: ChessPosition): cc.Vec2 {
        return cc.v2(
            this.ndBase.position.x + ipos.x * this.chessWidth,
            this.ndBase.position.y + ipos.y * this.chessHeight
        );
    }

    /**
     * 从对象池获取棋子节点
     * 优先使用池中现有节点，池空则创建新节点
     * @returns 可用的棋子节点
     */
    private getChessFromPool(): cc.Node {
        let chessNode = this.chessPool.get();
        if (!chessNode) {
            chessNode = cc.instantiate(this.pfchess);
        }
        chessNode.parent = this.node;
        // 重置棋子状态
        const chessScript = chessNode.getComponent('Chess');
        if (chessScript) {
            chessScript.reset();
        }
        return chessNode;
    }

    /**
     * 将棋子节点归还到对象池
     * @param chessNode - 要归还的棋子节点
     */
    private putChessToPool(chessNode: cc.Node): void {
        if (!chessNode) return;
        this.chessPool.put(chessNode);
    }

    /**
     * 回收所有活跃的棋子节点到对象池
     * 用于游戏重新开始或回放模式切换
     */
    private recycleAllChess(): void {
        for (const record of this.moveHistory) {
            if (record.chessNode) {
                this.putChessToPool(record.chessNode);
            }
        }
        this.moveHistory = [];
    }

    /**
     * 保存当前棋盘状态快照
     * 用于悔棋和回放功能
     * @returns 二维数组快照副本
     */
    private saveBoardSnapshot(): number[][] {
        const snapshot: number[][] = [];
        for (let i = 0; i < this.mapHeight; i++) {
            snapshot[i] = [];
            for (let j = 0; j < this.mapWidth; j++) {
                snapshot[i][j] = this.map[i][j];
            }
        }
        return snapshot;
    }

    /**
     * 处理触摸开始事件（落子逻辑）
     * @param evt - 触摸事件对象
     * 
     * 流程说明：
     * 1. 检查游戏状态是否允许落子（弹窗显示、游戏结束、AI思考中、禁止操作）
     * 2. 将屏幕坐标转换为棋盘坐标
     * 3. 检查落子位置是否有效（在棋盘范围内且该位置为空）
     * 4. 显示预览或确认落子
     */
    private touchBegan(evt: cc.Event.EventTouch): void {
        // 状态检查：弹窗显示中、游戏结束、AI思考中、回放模式中
        if (this.isPopupShowing || this.gameOver || this.isAIThinking) {
            return;
        }
        // PVE模式下，白方（AI）不能手动落子
        if (this.gameMode === 'pve' && this.playerIdx === 2) {
            return;
        }
        // 回放模式下禁止手动落子
        if (this.isReplayMode) {
            return;
        }

        // 1. 将触摸点转换到 ndBase 的本地坐标系
        const touchPos = evt.touch.getLocation();
        const posInNdBase = this.ndBase.convertToNodeSpaceAR(touchPos);

        // 2. 计算棋盘索引
        // ndBase 锚点(0.5,0.5)大小0，本地坐标原点即棋盘左下角
        // 格子(col,row)中心在 (col*chessWidth, row*chessHeight)
        const rawCol = posInNdBase.x / this.chessWidth;
        const rawRow = posInNdBase.y / this.chessHeight;

        cc.log('触摸屏幕坐标:', touchPos.x.toFixed(2), touchPos.y.toFixed(2));
        cc.log('ndBase本地坐标:', posInNdBase.x.toFixed(3), posInNdBase.y.toFixed(3));
        cc.log('chessWidth:', this.chessWidth, 'chessHeight:', this.chessHeight);
        cc.log('rawCol:', rawCol.toFixed(3), 'rawRow:', rawRow.toFixed(3));

        const col = Math.round(rawCol);
        const row = Math.round(rawRow);

        const ipos: ChessPosition = { x: col, y: row };

        cc.log('棋盘索引 ipos:', ipos.x, ipos.y);

        // 检查坐标是否在棋盘范围内
        if (ipos.x < 0 || ipos.x >= this.mapWidth || ipos.y < 0 || ipos.y >= this.mapHeight) {
            this.hidePreview();
            return;
        }

        // 检查该位置是否已有棋子
        if (this.map[ipos.y][ipos.x] !== 0) {
            this.hidePreview();
            return;
        }

        // 如果点击的是已预览位置，确认落子；否则显示新预览
        if (this.previewPosition && this.previewPosition.x === ipos.x && this.previewPosition.y === ipos.y) {
            this.confirmPlaceChess(ipos);
        } else {
            this.showPreview(ipos);
        }
    }

    /**
     * 显示落子预览
     * 在指定位置显示半透明棋子，预示即将落子
     * @param ipos - 棋盘坐标
     */
    private showPreview(ipos: ChessPosition): void {
        this.previewPosition = { x: ipos.x, y: ipos.y };

        // 创建预览节点（若不存在）
        if (!this.previewChessNode) {
            this.previewChessNode = cc.instantiate(this.pfchess);
            this.previewChessNode.parent = this.node;
            this.previewChessNode.opacity = 128; // 半透明显示
        }

        this.previewChessNode.setPosition(this.getChessPosition(ipos));
        this.previewChessNode.getComponent('Chess').updateUI(this.playerIdx);
        this.previewChessNode.active = true;

        this.AudioManager.play('preview');
    }

    /**
     * 隐藏落子预览
     * 清除预览位置和预览节点
     */
    private hidePreview(): void {
        this.previewPosition = null;
        if (this.previewChessNode) {
            this.previewChessNode.active = false;
        }
    }

    /**
     * 确认落子
     * 将棋子放置到棋盘，更新游戏状态，检查胜负
     * @param ipos - 确认的棋盘坐标
     * 
     * 核心逻辑：
     * 1. 隐藏预览，隐藏上一步标记
     * 2. 更新棋盘map，设置棋子属性
     * 3. 播放落子动画
     * 4. 记录落子历史、保存棋盘快照
     * 5. 检查是否获胜，决定是否切换玩家或结束游戏
     */
    private confirmPlaceChess(ipos: ChessPosition): void {
        this.hidePreview();

        // 隐藏上一步的最后落子标记
        if (this.lastChessNode) {
            const lastChessScript = this.lastChessNode.getComponent('Chess');
            if (lastChessScript) {
                lastChessScript.hideLastMoveMarker();
            }
        }

        // 更新棋盘状态
        this.map[ipos.y][ipos.x] = this.playerIdx;

        // 获取棋子并设置位置和显示
        const ndChess = this.getChessFromPool();
        ndChess.setPosition(this.getChessPosition(ipos));
        ndChess.getComponent('Chess').updateUI(this.playerIdx);

        const chessScript = ndChess.getComponent('Chess');
        const that = this;

        // 落子动画完成后，如果是PVE模式且当前是AI，触发AI思考
        chessScript.playPlaceAnimation(() => {
            if (that.gameMode === 'pve' && that.playerIdx === 2 && !that.gameOver) {
                that.triggerAIMove();
            }
        });

        // 显示当前落子为最后一步
        chessScript.showLastMoveMarker();
        this.lastChessNode = ndChess;

        // 记录落子（非悔棋操作时）
        if (!this.isUndoing) {
            this.recordMove(ipos.x, ipos.y, this.playerIdx, ndChess);
            this.boardSnapshots.push(this.saveBoardSnapshot());
        }

        this.AudioManager.play('placeChess');

        // 检查是否获胜
        const pos: [number, number] = [ipos.x, ipos.y];
        if (this.checkWin(pos)) {
            this.gameOver = true;
            this.initReplayManager();
            const winChains = this.getWinChains(pos);
            this.drawWinLine(winChains);
            this.scheduleOnce(() => {
                this.showWinPopup(this.playerIdx);
            }, 1.5);
        } else {
            // 切换玩家
            this.playerIdx = this.playerIdx === 1 ? 2 : 1;
            this.updatePlayerText();
            this.EventEmitter.emit(EventConst.ON_TURN);
        }
    }

    /**
     * 检查是否五子连珠（获胜）
     * @param pos - 刚落子的位置 [x, y]
     * @returns boolean 是否获胜
     * 
     * 检查四个方向：水平、垂直、右斜(\)、左斜(/)
     * count >= 5 表示五子连珠（不包含当前落子 + 相连的4个子）
     */
    private checkWin(pos: [number, number]): boolean {
        const player = this.map[pos[1]][pos[0]];
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

        for (const [dx, dy] of directions) {
            let count = 1;

            // 正向检查
            let nx = pos[0] + dx;
            let ny = pos[1] + dy;
            while (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight && this.map[ny][nx] === player) {
                count++;
                nx += dx;
                ny += dy;
            }

            // 反向检查
            nx = pos[0] - dx;
            ny = pos[1] - dy;
            while (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight && this.map[ny][nx] === player) {
                count++;
                nx -= dx;
                ny -= dy;
            }

            if (count >= 5) return true;
        }

        return false;
    }

    /**
     * 获取获胜棋子链
     * 找出所有构成五子连珠的棋子位置（去重合并）
     * @param pos - 刚落子的位置 [x, y]
     * @returns ChessPosition[] 获胜的棋子坐标数组
     */
    private getWinChains(pos: [number, number]): ChessPosition[] {
        const player = this.map[pos[1]][pos[0]];
        const winChains: ChessPosition[] = [];
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];

        for (const [dx, dy] of directions) {
            const chain: ChessPosition[] = [{ x: pos[0], y: pos[1] }];

            // 正向收集
            let nx = pos[0] + dx;
            let ny = pos[1] + dy;
            while (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight && this.map[ny][nx] === player) {
                chain.push({ x: nx, y: ny });
                nx += dx;
                ny += dy;
            }

            // 反向收集
            nx = pos[0] - dx;
            ny = pos[1] - dy;
            while (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight && this.map[ny][nx] === player) {
                chain.push({ x: nx, y: ny });
                nx -= dx;
                ny -= dy;
            }

            // 该方向五子连珠，加入结果
            if (chain.length >= 5) {
                winChains.push(...chain);
            }
        }

        // 去重：同一棋子可能出现在多个方向
        const uniqueChains: ChessPosition[] = [];
        const seen: { [key: string]: boolean } = {};
        for (const p of winChains) {
            const key = `${p.x},${p.y}`;
            if (!seen[key]) {
                seen[key] = true;
                uniqueChains.push(p);
            }
        }

        return uniqueChains;
    }

    /**
     * 绘制胜利连线
     * 使用Graphics组件绘制从首子到尾子的连线
     * @param winChains - 获胜的棋子坐标数组
     */
    private drawWinLine(winChains: ChessPosition[]): void {
        if (!this.graphicsLine || !this.graphicsLineNode || winChains.length < 2) return;

        this.graphicsLine.clear();
        const basePos = this.ndBase.position;

        // 计算连线的起点和终点坐标
        const startX = basePos.x + winChains[0].x * this.chessWidth;
        const startY = basePos.y + winChains[0].y * this.chessHeight;
        const endX = basePos.x + winChains[winChains.length - 1].x * this.chessWidth;
        const endY = basePos.y + winChains[winChains.length - 1].y * this.chessHeight;

        const lineWidth = this.chessWidth / 3;

        // 绘制两层线条实现发光效果
        // 外层：半透明金色
        this.graphicsLine.lineWidth = lineWidth;
        this.graphicsLine.strokeColor = cc.color(255, 215, 0, 100);
        this.graphicsLine.moveTo(startX, startY);
        this.graphicsLine.lineTo(endX, endY);
        this.graphicsLine.stroke();

        // 内层：亮黄色实线
        this.graphicsLine.lineWidth = lineWidth / 2;
        this.graphicsLine.strokeColor = cc.color(255, 255, 150, 255);
        this.graphicsLine.moveTo(startX, startY);
        this.graphicsLine.lineTo(endX, endY);
        this.graphicsLine.stroke();

        this.graphicsLineNode.active = true;

        // 1秒后自动隐藏
        this.scheduleOnce(() => {
            if (this.graphicsLineNode) {
                this.graphicsLineNode.active = false;
                this.graphicsLineNode.opacity = 255;
            }
        }, 1.0);
    }

    /**
     * 更新当前玩家显示文本
     * 根据playerIdx显示"黑方"或"白方"
     */
    private updatePlayerText(): void {
        if (this.textPlayer) {
            this.textPlayer.string = this.playerIdx === 1 ? '黑方' : '白方';
        }
    }

    /**
     * 显示胜利弹窗
     * @param winnerIdx - 获胜方索引：1=黑方，2=白方
     */
    private showWinPopup(winnerIdx: number): void {
        this.isPopupShowing = true;
        this.PopupManager.show('winLayer', { winner: winnerIdx });
        this.AudioManager.play('win');
    }

    /**
     * 触发AI落子
     * PVE模式下，玩家落子后AI自动思考并落子
     * 
     * 流程：
     * 1. 显示"AI思考中"提示
     * 2. 调用AI计算最佳位置
     * 3. AI落子后隐藏提示
     */
    private triggerAIMove(): void {
        this.isAIThinking = true;
        if (this.aiThinkingLabel) {
            this.aiThinkingLabel.node.active = true;
            this.aiThinkingLabel.string = 'AI思考中';
        }

       this.AI.getBestMove(this.map, 2)
                .then((move) => {
                    this.isAIThinking = false;
                    if (this.aiThinkingLabel) {
                        this.aiThinkingLabel.node.active = false;
                    }
                    if (move && move.x !== undefined && move.y !== undefined) {
                        this.confirmPlaceChess(move);
                    }
                })
                .catch((error) => {
                    cc.error('AI计算错误:', error);
                    this.isAIThinking = false;
                    if (this.aiThinkingLabel) {
                        this.aiThinkingLabel.node.active = false;
                    }
                });
    }

    /**
     * 记录落子到历史
     * @param x - 棋盘X坐标
     * @param y - 棋盘Y坐标
     * @param playerIdx - 玩家索引
     * @param chessNode - 棋子节点
     */
    private recordMove(x: number, y: number, playerIdx: number, chessNode: cc.Node): void {
        this.moveHistory.push({ x, y, playerIdx, chessNode });
    }

    /**
     * 悔棋（撤销上一步或上两步）
     * PVP模式：撤销玩家最后一步
     * PVE模式：撤销玩家和AI各一步（回到玩家回合）
     */
    private undoLastMove(): void {
        if (this.moveHistory.length === 0 || this.gameOver || this.isAIThinking) {
            return;
        }

        this.isUndoing = true;

        if (this.gameMode === 'pve') {
            // PVE模式：撤销AI一步和玩家一步
            if (this.moveHistory.length > 0) {
                const aiMove = this.moveHistory.pop();
                this.undoSingleMove(aiMove);
            }
            if (this.moveHistory.length > 0) {
                const playerMove = this.moveHistory.pop();
                this.undoSingleMove(playerMove);
            }
        } else {
            // PVP模式：撤销最后一步
            const lastMove = this.moveHistory.pop();
            this.undoSingleMove(lastMove);
        }

        this.isUndoing = false;
        this.AudioManager.play('buttonClick');
        this.EventEmitter.emit(EventConst.ON_UNDO);
    }

    /**
     * 执行单步撤销
     * 从棋盘移除棋子，恢复到之前的状态
     * @param move - 要撤销的落子记录
     */
    private undoSingleMove(move: MoveRecord): void {
        // 清除棋盘上的该位置
        this.map[move.y][move.x] = 0;
        
        // 将棋子归还到对象池
        if (move.chessNode) {
            this.putChessToPool(move.chessNode);
        }
        
        // 恢复到该落子前的玩家
        this.playerIdx = move.playerIdx;
        
        // 移除对应的棋盘快照
        if (this.boardSnapshots.length > 0) {
            this.boardSnapshots.pop();
        }
        
        this.updatePlayerText();

        // 更新最后落子标记（显示到上一步）
        if (this.lastChessNode) {
            const lastChessScript = this.lastChessNode.getComponent('Chess');
            if (lastChessScript) {
                lastChessScript.hideLastMoveMarker();
            }
        }

        if (this.moveHistory.length > 0) {
            const lastMove = this.moveHistory[this.moveHistory.length - 1];
            if (lastMove.chessNode) {
                const chessScript = lastMove.chessNode.getComponent('Chess');
                if (chessScript) {
                    chessScript.showLastMoveMarker();
                }
                this.lastChessNode = lastMove.chessNode;
            }
        } else {
            this.lastChessNode = null;
        }
    }

    /**
     * 悔棋按钮点击事件处理
     */
    private onUndoClick(): void {
        this.undoLastMove();
    }

    /**
     * 返回按钮点击事件处理
     * 返回登录界面
     */
    private onReturn(): void {
        this.AudioManager.play('menuClick');
        this.onClose()
    }

    /**
     * 初始化回放管理器
     * 配置回放回调函数和棋盘快照数据
     */
    private initReplayManager(): void {
        this.ReplayManager.init(this.moveHistory, this, {
            onProgressUpdate: this.onReplayProgressUpdate.bind(this),
            onStateChange: this.onReplayStateChange.bind(this),
        }, this.boardSnapshots);
    }

    /**
     * 回放进度更新回调
     * @param progress - 进度对象 { currentStep, totalSteps }
     */
    private onReplayProgressUpdate(progress: any): void {
        if (this.replayProgressLabel) {
            this.replayProgressLabel.string = `${progress.currentStep} / ${progress.totalSteps}`;
        }
    }

    /**
     * 回放状态变化回调
     * @param state - 新状态字符串
     */
    private onReplayStateChange(state: string): void {
        this.EventEmitter.emit(EventConst.ON_REPLAY_STATE, state);
    }

    /**
     * 开始回放
     * 切换到回放模式，重置棋盘显示，回放历史落子
     */
    @Broadcast
    private startReplay(): void {
        this.isReplayMode = true;
        this.isPopupShowing = false;
        this.clearBoardForReplay();

        if (this.replayUINode) {
            this.replayUINode.active = true;
        }

        this.ReplayManager.start();
    }

    /**
     * 停止回放
     * 退出回放模式，重新开始游戏
     */
    @Broadcast
    private stopReplay(): void {
        this.ReplayManager.stop();
        if (this.replayUINode) {
            this.replayUINode.active = false;
        }
        this.isReplayMode = false;
        this.restartGame();
    }

    /**
     * 回放中放置棋子
     * 由ReplayManager回调执行，用于重放历史棋局
     * @param x - 棋盘X坐标
     * @param y - 棋盘Y坐标
     * @param playerIdx - 玩家索引
     */
    replayPlaceChess(x: number, y: number, playerIdx: number): void {
        this.map[y][x] = playerIdx;
        const ndChess = this.getChessFromPool();
        ndChess.setPosition(this.getChessPosition({ x, y }));
        ndChess.getComponent('Chess').updateUI(playerIdx);
        const chessScript = ndChess.getComponent('Chess');
        chessScript.playPlaceAnimation();

        this.moveHistory.push({ x, y, playerIdx, chessNode: ndChess });

        // 隐藏上一步标记
        if (this.lastChessNode) {
            const lastChessScript = this.lastChessNode.getComponent('Chess');
            if (lastChessScript) {
                lastChessScript.hideLastMoveMarker();
            }
        }
        // 显示当前为最后一步
        chessScript.showLastMoveMarker();
        this.lastChessNode = ndChess;

        this.playerIdx = playerIdx;
        this.updatePlayerText();
    }

    /**
     * 清理棋盘为回放做准备
     * 清空棋盘、回收棋子、重置玩家
     */
    clearBoardForReplay(): void {
        this.recycleAllChess();
        for (let i = 0; i < this.mapHeight; i++) {
            for (let j = 0; j < this.mapWidth; j++) {
                this.map[i][j] = 0;
            }
        }
        this.lastChessNode = null;
        this.playerIdx = 1;
        this.updatePlayerText();
    }

    /**
     * 从棋盘快照恢复状态
     * 用于回放时的状态跳转
     * @param snapshot - 棋盘状态快照
     */
    restoreFromSnapshot(snapshot: number[][]): void {
        this.recycleAllChess();
        this.lastChessNode = null;

        let blackCount = 0;
        let whiteCount = 0;
        let lastPlayerIdx = 1;

        // 遍历快照恢复棋盘状态
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                this.map[y][x] = snapshot[y][x];
                if (snapshot[y][x] !== 0) {
                    const ndChess = this.getChessFromPool();
                    ndChess.setPosition(this.getChessPosition({ x, y }));
                    ndChess.getComponent('Chess').updateUI(snapshot[y][x]);

                    if (snapshot[y][x] === 1) {
                        blackCount++;
                        lastPlayerIdx = 1;
                    } else {
                        whiteCount++;
                        lastPlayerIdx = 2;
                    }
                    this.lastChessNode = ndChess;
                }
            }
        }

        // 显示最后落子标记
        if (this.lastChessNode) {
            const lastChessScript = this.lastChessNode.getComponent('Chess');
            if (lastChessScript) {
                lastChessScript.showLastMoveMarker();
            }
        }

        // 根据黑白子数量判断下一步该谁落子
        this.playerIdx = blackCount > whiteCount ? 2 : 1;
        this.updatePlayerText();
    }

    /**
     * 重新开始游戏
     * 重置所有游戏状态，清空棋盘和历史记录
     */
    @Broadcast
    private restartGame(): void {
        this.gameOver = false;
        this.isPopupShowing = false;
        this.playerIdx = 1;
        this.isUndoing = false;

        this.hidePreview();
        this.lastChessNode = null;
        this.boardSnapshots = [];

        // 先回收棋子，再清空 moveHistory
        this.recycleAllChess();
        this.moveHistory = [];

        // 清空棋盘
        for (let i = 0; i < this.mapHeight; i++) {
            for (let j = 0; j < this.mapWidth; j++) {
                this.map[i][j] = 0;
            }
        }

        if (this.graphicsLineNode) {
            this.graphicsLineNode.active = false;
        }

        this.updatePlayerText();
        this.gameInfoUI.reset();
    }

    /**
     * 关闭当前弹窗
     */
    protected onClose(): void {
        super.onClose();
    }

    onDestroy() {
        this.ResourceManager.release('BattleLayer');
    }
}