/**
 * 战斗场景脚本 - 五子棋游戏主逻辑
 * 负责处理游戏逻辑、棋子放置、胜负判断、UI交互
 * 包含落子预览功能和胜利弹窗功能
 */

cc.Class({
    extends: cc.Component,

    properties: {
        pfchess: cc.Prefab,          // 棋子预制体
        ndBase: cc.Node,             // 基准点节点
        chessWidth: 0,               // 棋子宽度
        chessHeigth: 0,              // 棋子高度
        mapWidth: 0,                 // 地图宽度（格子数）
        mapHeight: 0,                // 地图高度（格子数）
        text: cc.Label,              // 当前玩家显示文本
        
        // 胜利弹窗相关属性
        winPopupNode: cc.Node,       // 胜利弹窗节点（包含WinPopupManager脚本）
        
        // AI相关属性
        aiThinkingLabel: cc.Label,   // AI思考提示Label（编辑器中绑定）
        
        // 悔棋相关属性
        undoButton: cc.Button,       // 悔棋按钮（编辑器中绑定）
        
        // 游戏信息面板
        gameInfoNode: cc.Node,       // 游戏信息面板节点（包含GameInfoManager脚本）
        
        // 回放控制面板
        replayUINode: cc.Node,       // 回放控制UI节点（包含ReplayUI脚本）
        replayProgressLabel: cc.Label, // 回放进度标签（直接绑定，不依赖ReplayUI）
        
        // 粒子效果相关
        particleNode: cc.Node,      // 粒子效果节点（包含ParticleManager脚本）
        
        // 连线效果相关
        graphicsLineNode: cc.Node,  // 连线 Graphics 节点
    },

    /**
     * 组件加载时调用
     * 初始化游戏状态和棋盘数据
     */
    onLoad() {
        // 初始化当前玩家索引：1表示黑子，2表示白子
        this.playerIdx = 1;
        
        // 初始化游戏结束标志
        this.gameOver = false;
        
        // 弹窗显示状态标志
        this.isPopupShowing = false;
        
        // 落子预览相关状态
        this.previewPosition = null;     // 预览位置 {x, y}
        this.previewChessNode = null;    // 预览棋子节点
        
        // 最后落子标记相关
        this.lastChessNode = null;       // 最后落子的棋子节点
        
        // 悔棋功能相关状态
        this.moveHistory = [];           // 落子历史记录栈
        this.isUndoing = false;          // 是否正在执行悔棋操作
        
        // 回放模式相关状态
        this.isReplayMode = false;       // 是否处于回放模式
        
        // 棋盘快照数组（用于回放跳转优化）
        this.boardSnapshots = [];
        
        // 初始化棋盘数组，0表示空，1表示黑子，2表示白子
        this.map = [];
        for (let i = 0; i < this.mapHeight; ++i) {
            this.map[i] = [];
            for (let j = 0; j < this.mapWidth; ++j) {
                this.map[i][j] = 0;  // 初始化为空
            }
        }
        
        // 初始化胜利弹窗管理器
        this.winPopupManagerScript = null;
        if (this.winPopupNode) {
            // 从winPopupNode获取WinPopupManager组件
            this.winPopupManagerScript = this.winPopupNode.getComponent("WinPopupManager");
            // 设置胜利弹窗节点的zIndex，确保覆盖在棋子之上
            this.winPopupNode.zIndex = 100;
        }
        
        // 隐藏胜利弹窗
        if (this.winPopupNode) {
            this.winPopupNode.active = false;
        }
        
        // 初始化游戏信息面板管理器
        this.gameInfoManagerScript = null;
        if (this.gameInfoNode) {
            this.gameInfoManagerScript = this.gameInfoNode.getComponent("GameInfoManager");
        }
        
        // 初始化回放UI管理器
        this.replayUIScript = null;
        if (this.replayUINode) {
            this.replayUIScript = this.replayUINode.getComponent("ReplayUI");
            this.replayUINode.zIndex = 150;
        }
        
        // AI相关初始化
        this.gameMode = cc.sys.localStorage.getItem('gameMode') || 'pvp';
        this.isAIThinking = false;
        
        // AI配置（预留扩展）
        this.aiConfig = {
            maxThinkTime: 15000, // 思考时间限制（毫秒）
            difficulty: 'medium', // 难度级别（预留）
        };
        
        // 初始化AI模块
        this.ai = null;
        if (this.gameMode === 'pve') {
            try {
                this.ai = window.GobangAI;
            } catch (e) {
                cc.error("AI模块加载失败:", e);
            }
        }
        
        // 隐藏AI思考提示
        if (this.aiThinkingLabel) {
            this.aiThinkingLabel.node.active = false;
        }
        
        // 对象池初始化（性能优化：复用棋子节点，减少GC压力）
        this.chessPool = [];           // 棋子对象池
        this.chessPoolSize = 30;       // 对象池初始大小（预创建30个棋子）
        this.activeChessNodes = [];    // 当前激活的棋子节点列表
        
        // 预创建棋子到对象池
        this._initChessPool();
        
        // 初始化粒子效果管理器
        this._initParticleEffects();
        this._initWinLineGraphics();
    },
    
    /**
     * 初始化胜利连线 Graphics 节点
     */
    _initWinLineGraphics() {
        // 创建 Graphics 节点用于绘制五子连珠连线
        this.graphicsLineNode = new cc.Node("WinLineGraphics");
        this.graphicsLineNode.parent = this.node;
        
        // 位置设为0，画线时用绝对坐标
        this.graphicsLineNode.setPosition(0, 0);
        
        // 添加 Graphics 组件
        this.graphicsLine = this.graphicsLineNode.addComponent(cc.Graphics);
        
        // 初始隐藏，zIndex=55 在棋子(50)和UI(100)之间
        this.graphicsLineNode.active = false;
        this.graphicsLineNode.zIndex = 55;
    },
    
    /**
     * 落子高亮闪烁效果
     * 在落子位置显示金色闪烁方框
     * @param {Object} ipos - 棋盘格子坐标 {x, y}
     */
    _playPlaceHighlight(ipos) {
        // 获取棋盘基准点位置
        const basePos = this.ndBase.position;
        
        // 计算落子位置的世界坐标
        const x = basePos.x + ipos.x * this.chessWidth;
        const y = basePos.y + ipos.y * this.chessHeigth;
        
        // 创建高亮节点
        const highlightNode = new cc.Node("PlaceHighlight");
        highlightNode.parent = this.node;
        highlightNode.setPosition(x, y);
        highlightNode.zIndex = 54;
        
        // 添加 Graphics 组件
        const graphics = highlightNode.addComponent(cc.Graphics);
        
        const size = this.chessWidth * 0.9;
        const half = size / 2;
        
        // 绘制金色方框
        graphics.lineWidth = 3;
        graphics.strokeColor = cc.color(255, 215, 0, 255);  // 金色
        graphics.rect(-half, -half, size, size);
        graphics.stroke();
        
        // 闪烁动画：显现 → 隐藏 → 显现 → 隐藏 → 消失
        const show1 = cc.fadeTo(0.15, 255);
        const hide1 = cc.fadeTo(0.15, 0);
        const show2 = cc.fadeTo(0.15, 255);
        const hide2 = cc.fadeTo(0.15, 0);
        const show3 = cc.fadeTo(0.15, 255);
        const hide3 = cc.fadeTo(0.15, 0);
        const destroy = cc.callFunc(() => {
            if (highlightNode) {
                highlightNode.destroy();
            }
        });
        
        const seq = cc.sequence(show1, hide1, show2, hide2, show3, hide3, destroy);
        highlightNode.runAction(seq);
    },
    
    /**
     * 初始化粒子效果
     * 背景环境光点粒子
     */
    _initParticleEffects() {
        // 创建粒子效果管理器节点
        this.particleNode = new cc.Node("ParticleManager");
        this.particleNode.parent = this.node;
        
        // 设置粒子节点在屏幕中央
        this.particleNode.setPosition(0, 0);  // Battle 节点已经在屏幕中央，所以 ParticleManager 位置应该是 (0, 0)
        
        this.particleNode.zIndex = 1000;  // 放在最上层（用于测试）
        
        // 添加粒子管理器脚本（ParticleManager会在内部自动播放粒子）
        this.particleManager = this.particleNode.addComponent("ParticleManager");
    },

    /**
     * 初始化棋子对象池
     * 预创建指定数量的棋子节点，避免游戏中频繁创建
     */
    _initChessPool() {
        for (let i = 0; i < this.chessPoolSize; i++) {
            const chessNode = cc.instantiate(this.pfchess);
            chessNode.parent = this.node;
            chessNode.active = false;  // 隐藏状态
            this.chessPool.push(chessNode);
        }
        cc.log("对象池初始化完成，预创建", this.chessPoolSize, "个棋子");
    },

    /**
     * 从对象池获取棋子节点
     * 如果对象池为空，创建新节点
     * @returns {cc.Node} 棋子节点
     */
    _getChessFromPool() {
        let chessNode = null;
        
        if (this.chessPool.length > 0) {
            // 从对象池取出
            chessNode = this.chessPool.pop();
            cc.log("从对象池获取棋子，剩余:", this.chessPool.length);
        } else {
            // 对象池为空，创建新节点
            chessNode = cc.instantiate(this.pfchess);
            chessNode.parent = this.node;
            cc.log("对象池为空，创建新棋子");
        }
        
        // 重置棋子状态
        const chessScript = chessNode.getComponent("Chess");
        if (chessScript) {
            chessScript.reset();
        }
        
        // 添加到激活列表
        this.activeChessNodes.push(chessNode);
        
        return chessNode;
    },

    /**
     * 保存棋盘快照（用于回放跳转）
     * 返回棋盘状态的深拷贝
     * @returns {Array} 棋盘状态副本
     */
    _saveBoardSnapshot() {
        const snapshot = [];
        for (let i = 0; i < this.mapHeight; ++i) {
            snapshot[i] = [];
            for (let j = 0; j < this.mapWidth; ++j) {
                snapshot[i][j] = this.map[i][j];
            }
        }
        return snapshot;
    },

    /**
     * 回收棋子节点到对象池
     * @param {cc.Node} chessNode - 要回收的棋子节点
     */
    _putChessToPool(chessNode) {
        if (!chessNode) return;
        
        // 从激活列表移除
        const index = this.activeChessNodes.indexOf(chessNode);
        if (index > -1) {
            this.activeChessNodes.splice(index, 1);
        }
        
        // 隐藏节点
        chessNode.active = false;
        
        // 放回对象池
        this.chessPool.push(chessNode);
        cc.log("回收棋子到对象池，池大小:", this.chessPool.length);
    },

    /**
     * 回收所有激活的棋子到对象池
     */
    _recycleAllChess() {
        cc.log("开始回收所有棋子，数量:", this.activeChessNodes.length);
        
        // 复制数组，避免遍历时修改
        const nodesToRecycle = [...this.activeChessNodes];
        
        for (const node of nodesToRecycle) {
            this._putChessToPool(node);
        }
        
        cc.log("回收完成，对象池大小:", this.chessPool.length);
    },

    /**
     * 节点第一次激活时调用
     * 设置事件监听和初始化UI
     */
    start() {
        // 添加触摸开始事件监听
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchBegan, this);
        
        // 更新当前玩家显示文本
        this.updatePlayerText();
    },

    /**
     * 组件销毁时调用
     * 移除事件监听，避免内存泄漏
     */
    onDestroy() {
        // 移除触摸事件监听
        this.node.off(cc.Node.EventType.TOUCH_START, this.touchBegan, this);
    },

    /**
     * 返回登录场景
     */
    onReturn() {
        cc.director.loadScene("Login");
    },

    /**
     * 触摸开始事件处理
     * 实现落子预览功能：第一次点击显示预览，再次点击同一位置确认落子
     * @param {cc.Event} evt - 触摸事件对象
     */
    touchBegan(evt) {
        // 如果弹窗正在显示，不处理其他点击事件
        if (this.isPopupShowing) {
            return;
        }
        
        // 如果游戏已结束，不处理点击事件
        if (this.gameOver) {
            return;
        }
        
        // AI思考中不允许操作
        if (this.isAIThinking) {
            return;
        }
        
        // PvE模式，AI回合时不允许操作
        if (this.gameMode === 'pve' && this.playerIdx === 2) {
            return;
        }
        
        // 获取触摸位置（屏幕坐标）
        const posScreen = evt.getLocation();
        // 转换为节点空间坐标
        const posNode = this.node.convertToNodeSpaceAR(posScreen);
        // 获取基准点位置
        const posBase = this.ndBase.position;
        // 计算相对于基准点的位置
        const pos = posNode.sub(posBase);
        
        // 计算棋子在棋盘上的格子坐标
        const ipos = {
            x: Math.ceil(pos.x / this.chessWidth - 0.5),
            y: Math.ceil(pos.y / this.chessHeigth - 0.5),
        };
        
        // 检查是否超出棋盘边界
        if (ipos.x < 0 || ipos.x >= this.mapWidth || 
            ipos.y < 0 || ipos.y >= this.mapHeight) {
            // 点击边界外，隐藏预览
            this.hidePreview();
            return;
        }
        
        // 检查该位置是否已有棋子
        if (this.map[ipos.y][ipos.x] != 0) {
            // 已有棋子，隐藏预览
            this.hidePreview();
            return;
        }
        
        // 判断点击位置是否与预览位置相同
        if (this.previewPosition && 
            this.previewPosition.x === ipos.x && 
            this.previewPosition.y === ipos.y) {
            // 再次点击同一位置，确认落子
            this.confirmPlaceChess(ipos);
        } else {
            // 点击不同位置，更新预览
            this.showPreview(ipos);
        }
    },

    /**
     * 显示落子预览
     * @param {Object} ipos - 棋盘格子坐标 {x, y}
     */
    showPreview(ipos) {
        // 保存预览位置
        this.previewPosition = { x: ipos.x, y: ipos.y };
        
        // 如果预览棋子不存在，创建一个
        if (!this.previewChessNode) {
            this.previewChessNode = cc.instantiate(this.pfchess);
            this.previewChessNode.parent = this.node;
            // 设置半透明
            this.previewChessNode.opacity = 128;
        }
        
        // 更新预览棋子位置
        this.previewChessNode.setPosition(this._getChessPosition(ipos));
        // 更新预览棋子外观
        this.previewChessNode.getComponent("Chess").updateUI(this.playerIdx);
        // 显示预览棋子
        this.previewChessNode.active = true;
        
        // 播放预览音效
        AudioManager.play('preview');
    },

    /**
     * 隐藏落子预览
     */
    hidePreview() {
        this.previewPosition = null;
        if (this.previewChessNode) {
            this.previewChessNode.active = false;
        }
    },

    /**
     * 确认落子
     * @param {Object} ipos - 棋盘格子坐标 {x, y}
     */
    confirmPlaceChess(ipos) {
        // 隐藏预览
        this.hidePreview();
        
        // 清除上一个棋子的最后落子标记
        if (this.lastChessNode) {
            const lastChessScript = this.lastChessNode.getComponent("Chess");
            if (lastChessScript) {
                lastChessScript.hideLastMoveMarker();
            }
        }
        
        // 在棋盘数组中记录棋子
        this.map[ipos.y][ipos.x] = this.playerIdx;
        
        // 从对象池获取棋子（性能优化：复用已有节点，避免频繁创建）
        const ndChess = this._getChessFromPool();
        ndChess.setPosition(this._getChessPosition(ipos));
        ndChess.getComponent("Chess").updateUI(this.playerIdx);
        
        // 播放落子动画
        const chessScript = ndChess.getComponent("Chess");
        const that = this;
        
        // 使用动画回调，确保动画完成后再执行后续逻辑
        chessScript.playPlaceAnimation(() => {
            // 动画完成后的回调
            // PvE模式，AI回合（在动画完成后触发，避免主线程竞争）
            if (that.gameMode === 'pve' && that.playerIdx === 2 && !that.gameOver) {
                // 增加延迟，确保UI完全更新
                setTimeout(() => {
                    that.triggerAIMove();
                }, 100);
            }
        });
        
        // 播放落子特效（粒子效果）
        if (this.particleManager) {
            const chessWorldPos = ndChess.getPosition();
            this.particleManager.playPlaceChessEffect(chessWorldPos);
        }
        
        // 播放落子高亮闪烁效果
        this._playPlaceHighlight(ipos);
        
        // 显示最后落子标记
        chessScript.showLastMoveMarker();
        
        // 更新最后落子节点
        this.lastChessNode = ndChess;
        
        // 记录落子历史（悔棋功能）
        if (!this.isUndoing) {
            this.recordMove(ipos.x, ipos.y, this.playerIdx, ndChess);
            // 保存棋盘快照（用于回放跳转优化）
            this.boardSnapshots.push(this._saveBoardSnapshot());
        }
        
        // 播放落子音效
        AudioManager.play('placeChess');
        
        // 更新游戏信息面板（增加回合数）
        if (this.gameInfoManagerScript && !this.isUndoing) {
            this.gameInfoManagerScript.incrementTurn();
        }
        
        // 检查是否胜利
        const { x, y } = ipos;
        const _pos = [x, y];
        if (this._iswin(_pos)) {
            // 设置游戏结束标志
            this.gameOver = true;
            
            // 初始化回放管理器
            this._initReplayManager();
            
            // 获取获胜的棋子位置数组
            const winChains = this._getWinChains(_pos);
            
            // 播放胜利特效（粒子 + 光晕）
            if (this.particleManager) {
                const winPosition = this.lastChessNode ? this.lastChessNode.getPosition() : null;
                this.particleManager.playWinEffect(winPosition);
                // 同时显示胜利光晕
                this._showWinGlow(winPosition);
            }
            
            // 绘制五子连珠连线效果
            this._drawWinLine(winChains);
            
            // 所有获胜棋子弹跳动画（依次弹跳，增加视觉效果）
            const bounceDelay = 0.08; // 每个棋子之间的延迟
            const totalBounceTime = 0.8; // 弹跳动画总时长
            const winChainsLength = winChains.length;
            
            winChains.forEach((winPos, index) => {
                // 查找对应的棋子节点
                const chessNode = this._findChessNodeAt(winPos.x, winPos.y);
                if (chessNode) {
                    // 最后一个棋子弹得更高，强调最后落子
                    const isLast = (index === winChainsLength - 1);
                    this._playBounceAnimation(chessNode, index * bounceDelay, isLast);
                }
            });
            
            // 延迟显示胜利弹窗，确保动画和粒子效果能展示
            const showPopupDelay = totalBounceTime + (winChains.length * bounceDelay) + 0.5;
            this.scheduleOnce(() => {
                this.showWinPopup(this.playerIdx);
                console.log(`游戏结束！获胜方：${this.playerIdx == 1 ? "黑子" : "白子"}`);
            }, showPopupDelay);
        } else {
            // 切换玩家
            this.playerIdx = (this.playerIdx == 1 ? 2 : 1);
            // 更新当前玩家显示文本
            this.updatePlayerText();
        }
    },

    /**
     * 更新当前玩家显示文本
     */
    updatePlayerText() {
        if (this.text) {
            const str = (this.playerIdx == 1 ? "黑方" : "白方");
            this.text.string = str;
        }
    },

    /**
     * 显示胜利弹窗
     * @param {number} winnerIdx - 获胜方索引
     */
    showWinPopup(winnerIdx) {
        console.log(`显示胜利弹窗，获胜方：${winnerIdx == 1 ? "黑子" : "白子"}`);
        
        // 设置弹窗显示状态
        this.isPopupShowing = true;
        
        // 显示胜利弹窗节点
        if (this.winPopupNode) {
            this.winPopupNode.active = true;
            // 确保弹窗节点在最上层
            this.winPopupNode.zIndex = 200;
        }
        
        // 如果有WinPopupManager脚本，调用它的showWinPopup方法
        if (this.winPopupManagerScript) {
            this.winPopupManagerScript.showWinPopup(winnerIdx);
        }
        
        // 播放胜利音效
        AudioManager.play('win');
    },

    /**
     * 重新开始游戏
     */
    restartGame() {
        // 重置游戏状态
        this.gameOver = false;
        this.isPopupShowing = false;
        this.playerIdx = 1;
        
        // 隐藏预览
        this.hidePreview();
        
        // 重置最后落子标记
        this.lastChessNode = null;
        
        // 清空悔棋历史
        this.moveHistory = [];
        
        // 清空棋盘快照（用于回放跳转优化）
        this.boardSnapshots = [];
        
        // 清空棋盘
        for (let i = 0; i < this.mapHeight; ++i) {
            for (let j = 0; j < this.mapWidth; ++j) {
                this.map[i][j] = 0;
            }
        }
        
        // 回收所有棋子到对象池（性能优化：复用节点，避免销毁和重新创建）
        this._recycleAllChess();
        
        // 隐藏胜利弹窗
        if (this.winPopupNode) {
            this.winPopupNode.active = false;
        }
        
        // 重置游戏信息面板
        if (this.gameInfoManagerScript) {
            this.gameInfoManagerScript.reset();
            cc.log("游戏信息面板已重置");
        } else {
            cc.warn("gameInfoManagerScript 为 null，无法重置游戏信息面板");
        }
        
        // 更新显示文本
        this.updatePlayerText();
    },

    /**
     * 触发AI落子
     */
    triggerAIMove() {
        if (!this.ai) {
            cc.error("AI模块未初始化");
            this.defensiveRandomMove(); // 防守策略随机落子
            return;
        }
        
        this.isAIThinking = true;
        
        // 显示思考提示
        if (this.aiThinkingLabel) {
            this.aiThinkingLabel.node.active = true;
            this.aiThinkingLabel.string = "AI思考中";
        }
        
        // 使用setTimeout让出主线程，避免UI卡顿
        setTimeout(() => {
            // 调用AI计算（异步）
            this.ai.getBestMove(this.map, 2, this.aiConfig.maxThinkTime)
                .then((move) => {
                    this.isAIThinking = false;
                    
                    // 隐藏思考提示
                    if (this.aiThinkingLabel) {
                        this.aiThinkingLabel.node.active = false;
                    }
                    
                    if (move && move.x !== undefined && move.y !== undefined) {
                        // AI落子
                        this.confirmPlaceChess(move);
                    } else {
                        // 返回结果无效，防守策略随机落子
                        this.defensiveRandomMove();
                    }
                })
                .catch((error) => {
                    cc.error("AI计算错误:", error);
                    this.isAIThinking = false;
                    
                    // 隐藏思考提示
                    if (this.aiThinkingLabel) {
                        this.aiThinkingLabel.node.active = false;
                    }
                    
                    // 计算失败，防守策略随机落子
                    this.defensiveRandomMove();
                });
        }, 50); // 50ms延迟，让UI先更新
    },

    /**
     * 防守优先的随机落子策略
     */
    defensiveRandomMove() {
        const emptyPositions = [];
        const opponent = this.playerIdx === 1 ? 2 : 1;
        
        // 收集所有空位并评估威胁等级
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                if (this.map[y][x] === 0) {
                    const threatLevel = this.evaluateThreatLevel(x, y, opponent);
                    emptyPositions.push({x, y, threatLevel});
                }
            }
        }
        
        // 按威胁等级排序（高威胁优先防守）
        emptyPositions.sort((a, b) => b.threatLevel - a.threatLevel);
        
        // 选择最高威胁位置进行防守
        if (emptyPositions.length > 0) {
            this.confirmPlaceChess({x: emptyPositions[0].x, y: emptyPositions[0].y});
        }
    },

    /**
     * 评估位置对对手的威胁等级
     * @param {number} x - X坐标
     * @param {number} y - Y坐标  
     * @param {number} opponent - 对手玩家编号
     * @returns {number} 威胁等级分数
     */
    evaluateThreatLevel(x, y, opponent) {
        let threatScore = 0;
        
        // 临时放置对手棋子评估威胁
        this.map[y][x] = opponent;
        
        // 检查四个方向
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        for (const [dx, dy] of directions) {
            let count = 1;
            let openEnds = 0;
            
            // 正向检查
            let nx = x + dx;
            let ny = y + dy;
            while (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight && 
                   this.map[ny][nx] === opponent) {
                count++;
                nx += dx;
                ny += dy;
            }
            if (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight && 
                this.map[ny][nx] === 0) {
                openEnds++;
            }
            
            // 反向检查
            nx = x - dx;
            ny = y - dy;
            while (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight && 
                   this.map[ny][nx] === opponent) {
                count++;
                nx -= dx;
                ny -= dy;
            }
            if (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight && 
                this.map[ny][nx] === 0) {
                openEnds++;
            }
            
            // 根据棋型评分威胁等级
            if (count >= 5) {
                threatScore += 100000; // 连五（最高威胁）
            } else if (count === 4) {
                threatScore += openEnds === 2 ? 10000 : 1000; // 活四/冲四
            } else if (count === 3) {
                threatScore += openEnds === 2 ? 100 : 10; // 活三/眠三
            } else if (count === 2) {
                threatScore += openEnds === 2 ? 1 : 0; // 活二
            }
        }
        
        // 撤销临时落子
        this.map[y][x] = 0;
        
        return threatScore;
    },

    /**
     * 预留扩展接口：设置AI思考时间
     * @param {number} timeMs - 思考时间（毫秒）
     */
    setAIThinkTime(timeMs) {
        this.aiConfig.maxThinkTime = timeMs;
    },

    /**
     * 预留扩展接口：设置AI难度
     * @param {string} level - 难度级别：'easy', 'medium', 'hard'
     */
    setAIDifficulty(level) {
        this.aiConfig.difficulty = level;
        if (this.ai && typeof this.ai.setDifficulty === 'function') {
            this.ai.setDifficulty(level);
        }
    },

    /**
     * 检查是否胜利
     * @param {Array} pos - 最后落子的位置 [x, y]
     * @returns {boolean} 是否胜利
     */
    _iswin(pos) {
        const player = this.map[pos[1]][pos[0]];  // 获取当前玩家
        
        // 检查四个方向
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        
        for (const [dx, dy] of directions) {
            let count = 1;  // 包含当前棋子
            
            // 正向检查
            let nx = pos[0] + dx;
            let ny = pos[1] + dy;
            while (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight && 
                   this.map[ny][nx] === player) {
                count++;
                nx += dx;
                ny += dy;
            }
            
            // 反向检查
            nx = pos[0] - dx;
            ny = pos[1] - dy;
            while (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight && 
                   this.map[ny][nx] === player) {
                count++;
                nx -= dx;
                ny -= dy;
            }
            
            // 有5个或以上连续棋子则胜利
            if (count >= 5) return true;
        }
        
        return false;
    },

    /**
     * 获取获胜的棋子位置数组
     * @param {Array} pos - 最后落子的位置 [x, y]
     * @returns {Array} 获胜棋子位置数组 [{x, y}, ...]
     */
    _getWinChains(pos) {
        const player = this.map[pos[1]][pos[0]];
        const winChains = [];
        
        // 检查四个方向
        const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        
        for (const [dx, dy] of directions) {
            const chain = [{x: pos[0], y: pos[1]}];  // 包含当前棋子
            
            // 正向检查
            let nx = pos[0] + dx;
            let ny = pos[1] + dy;
            while (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight && 
                   this.map[ny][nx] === player) {
                chain.push({x: nx, y: ny});
                nx += dx;
                ny += dy;
            }
            
            // 反向检查
            nx = pos[0] - dx;
            ny = pos[1] - dy;
            while (nx >= 0 && nx < this.mapWidth && ny >= 0 && ny < this.mapHeight && 
                   this.map[ny][nx] === player) {
                chain.push({x: nx, y: ny});
                nx -= dx;
                ny -= dy;
            }
            
            // 有5个或以上连续棋子则记录
            if (chain.length >= 5) {
                winChains.push(...chain);
            }
        }
        
        // 去重（一个棋子可能在多个方向上）
        const uniqueChains = [];
        const seen = {};
        for (const pos of winChains) {
            const key = `${pos.x},${pos.y}`;
            if (!seen[key]) {
                seen[key] = true;
                uniqueChains.push(pos);
            }
        }
        
        return uniqueChains;
    },

    /**
     * 获取棋子在棋盘上的世界坐标
     * @param {Object} ipos - 棋盘格子坐标 {x, y}
     * @returns {cc.Vec2} 世界坐标
     */
    _getChessPosition(ipos) {
        return cc.v2(
            this.ndBase.position.x + ipos.x * this.chessWidth,
            this.ndBase.position.y + ipos.y * this.chessHeigth
        );
    },

    /**
     * 查找指定位置的棋子节点
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {cc.Node|null} 棋子节点
     */
    _findChessNodeAt(x, y) {
        const targetPos = this._getChessPosition({x, y});
        for (const chessNode of this.activeChessNodes) {
            const pos = chessNode.getPosition();
            if (Math.abs(pos.x - targetPos.x) < 1 && Math.abs(pos.y - targetPos.y) < 1) {
                return chessNode;
            }
        }
        return null;
    },

    /**
     * 播放弹跳动画（更自然的弹跳效果）
     * @param {cc.Node} node - 要弹跳的节点
     * @param {number} delay - 延迟时间（让棋子依次弹跳）
     * @param {boolean} isLast - 是否是最后一个棋子（最后落子弹得更高）
     */
    _playBounceAnimation(node, delay = 0, isLast = false) {
        // 设置初始缩放
        node.scale = 1.0;
        
        // 最后落子弹得更高（1.5 vs 1.35），更有冲击力
        const maxScale = isLast ? 1.5 : 1.35;
        
        // 创建更自然的弹跳效果
        const jump1 = cc.scaleTo(0.12, maxScale).easing(cc.easeOut(3));
        const jump2 = cc.scaleTo(0.08, 0.85).easing(cc.easeIn(3));
        const jump3 = cc.scaleTo(0.12, 1.25).easing(cc.easeOut(3));
        const jump4 = cc.scaleTo(0.08, 0.9).easing(cc.easeIn(3));
        const jump5 = cc.scaleTo(0.1, 1.15).easing(cc.easeOut(2));
        const jump6 = cc.scaleTo(0.08, 0.95).easing(cc.easeIn(2));
        const jump7 = cc.scaleTo(0.1, 1.05).easing(cc.easeOut(2));
        const jump8 = cc.scaleTo(0.1, 1.0);
        
        // 延迟后播放
        const delayAction = cc.delayTime(delay);
        const bounceAction = cc.sequence(jump1, jump2, jump3, jump4, jump5, jump6, jump7, jump8);
        
        node.runAction(cc.sequence(delayAction, bounceAction));
    },
    
    /**
     * 绘制五子连珠连线效果
     * 从第一个棋子连线到最后一个棋子
     * @param {Array} winChains - 获胜棋子位置数组 [{x,y}, ...]
     */
    _drawWinLine(winChains) {
        if (!this.graphicsLine || !this.graphicsLineNode) {
            cc.error("胜利连线Graphics未初始化");
            return;
        }
        
        if (winChains.length < 2) return;
        
        // 清空之前的内容
        this.graphicsLine.clear();
        
        // 获取棋盘基准点位置
        const basePos = this.ndBase.position;
        
        // 计算起点和终点坐标
        const startX = basePos.x + winChains[0].x * this.chessWidth;
        const startY = basePos.y + winChains[0].y * this.chessHeigth;
        const endX = basePos.x + winChains[winChains.length - 1].x * this.chessWidth;
        const endY = basePos.y + winChains[winChains.length - 1].y * this.chessHeigth;
        
        // 线宽为棋子宽度的1/3
        const lineWidth = this.chessWidth / 3;
        
        // 绘制发光连线（两层）
        // 外层 - 淡金色
        this.graphicsLine.lineWidth = lineWidth;
        this.graphicsLine.strokeColor = cc.color(255, 215, 0, 100);
        this.graphicsLine.moveTo(startX, startY);
        this.graphicsLine.lineTo(endX, endY);
        this.graphicsLine.stroke();
        
        // 内层 - 亮金色
        this.graphicsLine.lineWidth = lineWidth / 2;
        this.graphicsLine.strokeColor = cc.color(255, 255, 150, 255);
        this.graphicsLine.moveTo(startX, startY);
        this.graphicsLine.lineTo(endX, endY);
        this.graphicsLine.stroke();
        
        // 显示节点
        this.graphicsLineNode.active = true;
        
        // 动画效果：1s后渐隐
        this.scheduleOnce(() => {
            this._fadeOutWinLine();
        }, 1.0);
    },
    
    /**
     * 显示胜利光晕效果（明显可见）
     * @param {cc.Vec2} position - 胜利位置
     */
    _showWinGlow(position) {
        if (!position) return;
        
        const x = position.x !== undefined ? position.x : position.xx;
        const y = position.y !== undefined ? position.y : position.yy;
        
        // 创建光晕节点
        const glowNode = new cc.Node("WinGlow");
        glowNode.parent = this.node;
        glowNode.setPosition(x, y);
        glowNode.zIndex = 35;  // 在棋子下面，周围
        
        const graphics = glowNode.addComponent(cc.Graphics);
        
        // 绘制金色光晕（多层同心圆）
        const colors = [
            { r: 255, g: 215, b: 0, a: 80, radius: 60 },   // 外层淡
            { r: 255, g: 215, b: 0, a: 150, radius: 40 },  // 中层
            { r: 255, g: 255, b: 100, a: 255, radius: 25 }, // 内层亮
        ];
        
        colors.forEach(c => {
            graphics.lineWidth = 8;
            graphics.strokeColor = cc.color(c.r, c.g, c.b, c.a);
            graphics.circle(0, 0, c.radius);
            graphics.stroke();
        });
        
        // 动画：放大 + 闪烁 + 消失
        const scale1 = cc.scaleTo(0.3, 1.3).easing(cc.easeOut(2));
        const fade1 = cc.fadeTo(0.3, 0);
        
        glowNode.runAction(cc.spawn(scale1, fade1));
        
        // 动画结束后销毁
        glowNode.runAction(cc.sequence(
            cc.delayTime(0.3),
            cc.callFunc(() => glowNode.destroy())
        ));
    },
    
    /**
     * 胜利连线渐隐动画
     */
    _fadeOutWinLine() {
        if (!this.graphicsLineNode) return;
        
        // 创建渐隐动画
        const fadeAction = cc.fadeOut(0.8);
        const hideAction = cc.callFunc(() => {
            if (this.graphicsLineNode) {
                this.graphicsLineNode.active = false;
                this.graphicsLineNode.opacity = 255;  // 重置透明度
            }
        });
        
        this.graphicsLineNode.runAction(cc.sequence(fadeAction, hideAction));
    },

    // ==================== 悔棋功能相关方法 ====================

    /**
     * 记录落子历史（悔棋功能）
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} playerIdx - 玩家索引
     * @param {cc.Node} chessNode - 棋子节点
     */
    recordMove(x, y, playerIdx, chessNode) {
        this.moveHistory.push({ x, y, playerIdx, chessNode });
    },

    /**
     * 悔棋操作
     * 撤销最后一步落子，PvE模式下撤销玩家和AI的两步
     */
    undoLastMove() {
        // 检查是否可以悔棋
        if (this.moveHistory.length === 0) {
            return;
        }
        
        if (this.gameOver) {
            return;
        }
        
        if (this.isAIThinking) {
            return;
        }
        
        // PvE模式下撤销两步（玩家和AI）
        if (this.gameMode === 'pve') {
            // 撤销AI的落子
            if (this.moveHistory.length > 0) {
                const aiMove = this.moveHistory.pop();
                this._undoSingleMove(aiMove);
            }
            // 撤销玩家的落子
            if (this.moveHistory.length > 0) {
                const playerMove = this.moveHistory.pop();
                this._undoSingleMove(playerMove);
            }
        } else {
            // PvP模式下只撤销一步
            const lastMove = this.moveHistory.pop();
            this._undoSingleMove(lastMove);
        }
        
        // 播放悔棋音效
        AudioManager.play('buttonClick');
        
        // 更新游戏信息面板（增加悔棋次数）
        if (this.gameInfoManagerScript) {
            this.gameInfoManagerScript.incrementUndoCount();
        } else {
            cc.warn("gameInfoManagerScript 未绑定，无法更新悔棋次数");
        }
    },

    /**
     * 撤销单步落子
     * @param {Object} move - 落子记录 {x, y, playerIdx, chessNode}
     */
    _undoSingleMove(move) {
        // 从棋盘数组中清除棋子
        this.map[move.y][move.x] = 0;
        
        // 回收棋子节点到对象池
        if (move.chessNode) {
            this._putChessToPool(move.chessNode);
        }
        
        // 切换回上一个玩家
        this.playerIdx = move.playerIdx;
        
        // 弹出对应的棋盘快照
        if (this.boardSnapshots.length > 0) {
            this.boardSnapshots.pop();
        }
        
        // 更新显示文本
        this.updatePlayerText();
        
        // 更新最后落子标记
        this._updateLastMoveMarker();
    },

    /**
     * 更新最后落子标记
     */
    _updateLastMoveMarker() {
        // 隐藏当前最后落子标记
        if (this.lastChessNode) {
            const lastChessScript = this.lastChessNode.getComponent("Chess");
            if (lastChessScript) {
                lastChessScript.hideLastMoveMarker();
            }
        }
        
        // 如果还有历史记录，显示上一个落子标记
        if (this.moveHistory.length > 0) {
            const lastMove = this.moveHistory[this.moveHistory.length - 1];
            if (lastMove.chessNode) {
                const chessScript = lastMove.chessNode.getComponent("Chess");
                if (chessScript) {
                    chessScript.showLastMoveMarker();
                }
                this.lastChessNode = lastMove.chessNode;
            }
        } else {
            this.lastChessNode = null;
        }
    },

    /**
     * 悔棋按钮点击事件处理
     */
    onUndoClick() {
        this.undoLastMove();
    },

    // ==================== 回放功能相关方法 ====================

    /**
     * 初始化回放管理器
     * 在游戏结束时调用
     */
    _initReplayManager() {
        if (typeof ReplayManager === 'undefined') {
            return;
        }
        
        // 传递棋盘快照数组，用于回放跳转优化
        ReplayManager.init(this.moveHistory, this, {
            onProgressUpdate: this._onReplayProgressUpdate.bind(this),
            onStateChange: this._onReplayStateChange.bind(this),
        }, this.boardSnapshots);
    },

    /**
     * 开始查看回放
     */
    startReplay() {
        if (typeof ReplayManager === 'undefined') {
            return;
        }
        
        this.isReplayMode = true;
        
        if (this.winPopupNode) {
            this.winPopupNode.active = false;
        }
        this.isPopupShowing = false;
        
        this.clearBoardForReplay();
        
        if (this.replayUINode) {
            this.replayUINode.active = true;
            this.replayUINode.zIndex = 150;
        }
        
        if (this.replayUIScript) {
            this.replayUIScript.show();
        }
        
        ReplayManager.start();
    },

    /**
     * 停止回放
     */
    stopReplay() {
        if (typeof ReplayManager === 'undefined') {
            return;
        }
        
        ReplayManager.stop();
        
        if (this.replayUIScript) {
            this.replayUIScript.hide();
        }
        
        if (this.replayUINode) {
            this.replayUINode.active = false;
        }
        
        this.isReplayMode = false;
        
        // 重置游戏
        this.restartGame();
    },

    /**
     * 切换回放播放/暂停
     */
    toggleReplayPlayPause() {
        if (typeof ReplayManager === 'undefined') {
            return;
        }
        ReplayManager.togglePlayPause();
    },

    /**
     * 回放前进一步
     */
    replayStepForward() {
        if (typeof ReplayManager === 'undefined') {
            return;
        }
        ReplayManager.stepForward();
    },

    /**
     * 回放后退一步
     */
    replayStepBackward() {
        if (typeof ReplayManager === 'undefined') {
            return;
        }
        ReplayManager.stepBackward();
    },

    /**
     * 回放时落子
     */
    replayPlaceChess(x, y, playerIdx) {
        this.map[y][x] = playerIdx;
        
        const ndChess = this._getChessFromPool();
        ndChess.setPosition(this._getChessPosition({x, y}));
        ndChess.getComponent("Chess").updateUI(playerIdx);
        
        const chessScript = ndChess.getComponent("Chess");
        chessScript.playPlaceAnimation();
        
        if (this.lastChessNode) {
            const lastChessScript = this.lastChessNode.getComponent("Chess");
            if (lastChessScript) {
                lastChessScript.hideLastMoveMarker();
            }
        }
        chessScript.showLastMoveMarker();
        this.lastChessNode = ndChess;
        
        this.playerIdx = playerIdx;
        this.updatePlayerText();
    },

    /**
     * 从快照恢复棋盘状态（用于回放快速跳转）
     * @param {Array} snapshot - 棋盘状态二维数组
     */
    restoreFromSnapshot(snapshot) {
        // 清空当前棋盘
        this._recycleAllChess();
        this.lastChessNode = null;
        
        // 遍历快照恢复棋子并统计数量
        let blackCount = 0;
        let whiteCount = 0;
        let lastPlayerIdx = GameConfig.CHESS.PLAYER_BLACK;
        
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                this.map[y][x] = snapshot[y][x];
                
                if (snapshot[y][x] !== GameConfig.CHESS.EMPTY) {
                    const ndChess = this._getChessFromPool();
                    ndChess.setPosition(this._getChessPosition({x, y}));
                    ndChess.getComponent("Chess").updateUI(snapshot[y][x]);
                    
                    // 统计黑白棋数量，记录最后落子的玩家
                    if (snapshot[y][x] === GameConfig.CHESS.PLAYER_BLACK) {
                        blackCount++;
                        lastPlayerIdx = GameConfig.CHESS.PLAYER_BLACK;
                    } else {
                        whiteCount++;
                        lastPlayerIdx = GameConfig.CHESS.PLAYER_WHITE;
                    }
                    this.lastChessNode = ndChess;
                }
            }
        }
        
        // 显示最后落子标记
        if (this.lastChessNode) {
            const lastChessScript = this.lastChessNode.getComponent("Chess");
            if (lastChessScript) {
                lastChessScript.showLastMoveMarker();
            }
        }
        
        // 更新当前玩家：黑子数 > 白子数时轮到白子，否则轮到黑子
        this.playerIdx = (blackCount > whiteCount) ? GameConfig.CHESS.PLAYER_WHITE : GameConfig.CHESS.PLAYER_BLACK;
        this.updatePlayerText();
    },

    /**
     * 清空棋盘用于回放
     */
    clearBoardForReplay() {
        this._recycleAllChess();
        
        for (let i = 0; i < this.mapHeight; ++i) {
            for (let j = 0; j < this.mapWidth; ++j) {
                this.map[i][j] = GameConfig.CHESS.EMPTY;
            }
        }
        
        this.lastChessNode = null;
        this.playerIdx = GameConfig.CHESS.PLAYER_BLACK;
        this.updatePlayerText();
    },

    /**
     * 回放进度更新回调
     */
    _onReplayProgressUpdate(progress) {
        // 直接更新进度标签
        if (this.replayProgressLabel) {
            this.replayProgressLabel.string = `${progress.currentStep} / ${progress.totalSteps}`;
        }
        
        // 同时尝试更新ReplayUI（如果存在）
        if (this.replayUIScript) {
            this.replayUIScript.updateProgress(progress);
        }
    },

    /**
     * 回放状态变化回调
     */
    _onReplayStateChange(state) {
        if (this.replayUIScript) {
            this.replayUIScript.updateProgress(ReplayManager.getProgress());
        }
    },
});
