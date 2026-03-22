/**
 * 五子棋AI算法模块
 * 预留扩展接口，支持难度调整
 */
var GobangAI = cc.Class({
    name: 'GobangAI',
    
    ctor: function() {
        // 默认配置（预留扩展）
        this.config = {
            difficulty: 'medium',
            searchDepth: 3,
            maxThinkTime: 15000,
            scores: {
                FIVE: 100000,
                FOUR: 10000,
                BLOCKED_FOUR: 1000,
                THREE: 100,
                BLOCKED_THREE: 10,
                TWO: 1,
            }
        };
    },
    
    /**
     * 获取AI最佳落子位置
     * @param {Array} board - 棋盘状态
     * @param {number} player - AI玩家编号
     * @param {number} maxTime - 最大思考时间（毫秒）
     * @returns {Promise} 返回落子位置 {x, y}
     */
    getBestMove: function(board, player, maxTime) {
        var self = this;
        maxTime = maxTime || this.config.maxThinkTime;
        
        return new Promise(function(resolve, reject) {
            var startTime = Date.now();
            var bestMove = null;
            var bestScore = -Infinity;
            var currentIndex = 0;
            var defendMoves = [];
            
            try {
                // 获取有效位置（启发式搜索）
                var validMoves = self.getValidMoves(board);
                
                // 查找对手四连的威胁位置
                var threats = self.findOpponentFours(board, player);
                // 将威胁位置合并到有效位置中
                for (var t = 0; t < threats.length; t++) {
                    var threat = threats[t];
                    // 检查是否已存在
                    var exists = validMoves.some(function(move) {
                        return move.x === threat.x && move.y === threat.y;
                    });
                    if (!exists) {
                        validMoves.push(threat);
                    }
                }
                
                if (validMoves.length === 0) {
                    // 没有有效位置，返回中心点
                    var center = Math.floor(board.length / 2);
                    resolve({x: center, y: center});
                    return;
                }
                
                // 分步处理，避免阻塞主线程
                function processBatch() {
                    var batchSize = 5; // 每批处理5个位置
                    var endIndex = Math.min(currentIndex + batchSize, validMoves.length);
                    
                    for (var i = currentIndex; i < endIndex; i++) {
                        var move = validMoves[i];
                        
                        // 检查超时
                        if (Date.now() - startTime > maxTime) {
                            // 超时，返回当前最佳结果
                            resolve(bestMove || {x: validMoves[0].x, y: validMoves[0].y});
                            return;
                        }
                        
                        // 检查对手是否在此位置获胜
                        var opponent = player === 1 ? 2 : 1;
                        board[move.y][move.x] = opponent;
                        if (self.isGameOver(board)) {
                            // 对手能赢，AI必须防守
                            defendMoves.push({x: move.x, y: move.y});
                        }
                        board[move.y][move.x] = 0; // 撤销
                        
                        // 模拟落子
                        board[move.y][move.x] = player;
                        
                        // 检查是否立即获胜
                        if (self.isGameOver(board)) {
                            // 立即获胜，返回该位置
                            resolve({x: move.x, y: move.y});
                            return;
                        }
                        
                        // 评估分数
                        var score = self.minimax(board, self.config.searchDepth, 
                            -Infinity, Infinity, false, player);
                        
                        // 撤销落子
                        board[move.y][move.x] = 0;
                        
                        if (score > bestScore) {
                            bestScore = score;
                            bestMove = {x: move.x, y: move.y};
                        }
                    }
                    
                    currentIndex = endIndex;
                    
                    // 检查是否处理完所有位置
                    if (currentIndex >= validMoves.length) {
                        // 如果有防守位置，优先选择
                        if (defendMoves.length > 0) {
                            resolve(defendMoves[0]);
                        } else {
                            resolve(bestMove || {x: validMoves[0].x, y: validMoves[0].y});
                        }
                    } else {
                        // 继续处理下一批，让出主线程
                        setTimeout(processBatch, 0);
                    }
                }
                
                // 开始分步处理
                processBatch();
                
            } catch (error) {
                reject(error);
            }
        });
    },
    
    /**
     * Minimax算法 + Alpha-Beta剪枝
     * @param {Array} board - 棋盘状态
     * @param {number} depth - 搜索深度
     * @param {number} alpha - Alpha值
     * @param {number} beta - Beta值
     * @param {boolean} isMaximizing - 是否最大化层
     * @param {number} aiPlayer - AI玩家编号
     * @returns {number} 评估分数
     */
    minimax: function(board, depth, alpha, beta, isMaximizing, aiPlayer) {
        // 基准条件
        if (depth === 0 || this.isGameOver(board)) {
            return this.evaluateBoard(board, aiPlayer);
        }
        
        var validMoves = this.getValidMoves(board);
        
        if (isMaximizing) {
            var maxEval = -Infinity;
            for (var i = 0; i < validMoves.length; i++) {
                var move = validMoves[i];
                board[move.y][move.x] = aiPlayer;
                var evalScore = this.minimax(board, depth - 1, alpha, beta, false, aiPlayer);
                board[move.y][move.x] = 0;
                maxEval = Math.max(maxEval, evalScore);
                alpha = Math.max(alpha, evalScore);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            var minEval = Infinity;
            var opponent = aiPlayer === 1 ? 2 : 1;
            for (var i = 0; i < validMoves.length; i++) {
                var move = validMoves[i];
                board[move.y][move.x] = opponent;
                var evalScore = this.minimax(board, depth - 1, alpha, beta, true, aiPlayer);
                board[move.y][move.x] = 0;
                minEval = Math.min(minEval, evalScore);
                beta = Math.min(beta, evalScore);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    },
    
    /**
     * 评估棋盘分数
     * @param {Array} board - 棋盘状态
     * @param {number} player - AI玩家编号
     * @returns {number} 评估分数
     */
    evaluateBoard: function(board, player) {
        var score = 0;
        var opponent = player === 1 ? 2 : 1;
        
        // 评估所有位置的棋型
        for (var y = 0; y < board.length; y++) {
            for (var x = 0; x < board[y].length; x++) {
                if (board[y][x] === player) {
                    score += this.evaluatePosition(board, x, y, player);
                } else if (board[y][x] === opponent) {
                    score -= this.evaluatePosition(board, x, y, opponent);
                }
            }
        }
        
        return score;
    },
    
    /**
     * 评估单个位置的棋型分数
     * @param {Array} board - 棋盘状态
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} player - 玩家编号
     * @returns {number} 棋型分数
     */
    evaluatePosition: function(board, x, y, player) {
        var score = 0;
        var directions = [
            [1, 0],   // 水平
            [0, 1],   // 垂直
            [1, 1],   // 右斜
            [1, -1],  // 左斜
        ];
        
        for (var d = 0; d < directions.length; d++) {
            var dx = directions[d][0];
            var dy = directions[d][1];
            var count = 1;  // 当前棋子
            var openEnds = 0; // 开放端数量
            
            // 正向检查
            var nx = x + dx;
            var ny = y + dy;
            while (nx >= 0 && nx < board[0].length && ny >= 0 && ny < board.length && 
                   board[ny][nx] === player) {
                count++;
                nx += dx;
                ny += dy;
            }
            if (nx >= 0 && nx < board[0].length && ny >= 0 && ny < board.length && 
                board[ny][nx] === 0) {
                openEnds++;
            }
            
            // 反向检查
            nx = x - dx;
            ny = y - dy;
            while (nx >= 0 && nx < board[0].length && ny >= 0 && ny < board.length && 
                   board[ny][nx] === player) {
                count++;
                nx -= dx;
                ny -= dy;
            }
            if (nx >= 0 && nx < board[0].length && ny >= 0 && ny < board.length && 
                board[ny][nx] === 0) {
                openEnds++;
            }
            
            // 根据棋型评分
            if (count >= 5) {
                score += this.config.scores.FIVE;
            } else if (count === 4) {
                score += openEnds === 2 ? this.config.scores.FOUR : this.config.scores.BLOCKED_FOUR;
            } else if (count === 3) {
                score += openEnds === 2 ? this.config.scores.THREE : this.config.scores.BLOCKED_THREE;
            } else if (count === 2) {
                score += openEnds === 2 ? this.config.scores.TWO : 0;
            }
        }
        
        return score;
    },
    
    /**
     * 查找对手所有四连的威胁位置
     * @param {Array} board - 棋盘状态
     * @param {number} aiPlayer - AI玩家编号
     * @returns {Array} 威胁位置数组
     */
    findOpponentFours: function(board, aiPlayer) {
        var opponent = aiPlayer === 1 ? 2 : 1;
        var threats = [];
        var directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
        var size = board.length;
        
        // 遍历棋盘所有位置
        for (var y = 0; y < size; y++) {
            for (var x = 0; x < size; x++) {
                if (board[y][x] === opponent) {
                    // 检查四个方向
                    for (var d = 0; d < directions.length; d++) {
                        var dx = directions[d][0];
                        var dy = directions[d][1];
                        
                        // 计算连续棋子数
                        var count = 1;
                        var openEnds = 0;
                        var threatPos = null;
                        
                        // 正向检查
                        var nx = x + dx;
                        var ny = y + dy;
                        while (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === opponent) {
                            count++;
                            nx += dx;
                            ny += dy;
                        }
                        if (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === 0) {
                            openEnds++;
                            threatPos = {x: nx, y: ny};
                        }
                        
                        // 反向检查
                        nx = x - dx;
                        ny = y - dy;
                        while (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === opponent) {
                            count++;
                            nx -= dx;
                            ny -= dy;
                        }
                        if (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === 0) {
                            openEnds++;
                            if (!threatPos) threatPos = {x: nx, y: ny};
                        }
                        
                        // 如果是四连（活四或冲四）
                        if (count === 4 && openEnds > 0) {
                            // 添加威胁位置
                            if (threatPos) {
                                // 避免重复
                                var alreadyAdded = threats.some(function(pos) {
                                    return pos.x === threatPos.x && pos.y === threatPos.y;
                                });
                                if (!alreadyAdded) {
                                    threats.push(threatPos);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return threats;
    },
    
    /**
     * 获取有效位置（启发式搜索）
     * @param {Array} board - 棋盘状态
     * @returns {Array} 有效位置数组
     */
    getValidMoves: function(board) {
        var moves = [];
        var size = board.length;
        var checked = {};
        
        // 如果棋盘为空，返回中心点
        var hasChess = false;
        for (var y = 0; y < size; y++) {
            for (var x = 0; x < size; x++) {
                if (board[y][x] !== 0) {
                    hasChess = true;
                    break;
                }
            }
            if (hasChess) break;
        }
        
        if (!hasChess) {
            var center = Math.floor(size / 2);
            return [{x: center, y: center}];
        }
        
        // 只搜索已有棋子周围2格范围内的空位
        for (var y = 0; y < size; y++) {
            for (var x = 0; x < size; x++) {
                if (board[y][x] !== 0) {
                    for (var dy = -2; dy <= 2; dy++) {
                        for (var dx = -2; dx <= 2; dx++) {
                            var ny = y + dy;
                            var nx = x + dx;
                            if (ny >= 0 && ny < size && nx >= 0 && nx < size && 
                                board[ny][nx] === 0) {
                                var key = nx + ',' + ny;
                                if (!checked[key]) {
                                    checked[key] = true;
                                    moves.push({x: nx, y: ny});
                                }
                            }
                        }
                    }
                }
            }
        }
        
        return moves;
    },
    
    /**
     * 检查游戏是否结束
     * @param {Array} board - 棋盘状态
     * @returns {boolean} 是否结束
     */
    isGameOver: function(board) {
        for (var y = 0; y < board.length; y++) {
            for (var x = 0; x < board[y].length; x++) {
                if (board[y][x] !== 0) {
                    // 检查四个方向是否有五连珠
                    var directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
                    for (var d = 0; d < directions.length; d++) {
                        var dx = directions[d][0];
                        var dy = directions[d][1];
                        var count = 1;
                        var nx = x + dx;
                        var ny = y + dy;
                        while (nx >= 0 && nx < board[0].length && ny >= 0 && ny < board.length && 
                               board[ny][nx] === board[y][x]) {
                            count++;
                            nx += dx;
                            ny += dy;
                        }
                        if (count >= 5) return true;
                    }
                }
            }
        }
        return false;
    },
    
    /**
     * 预留扩展接口：设置难度
     * @param {string} level - 难度级别：'easy', 'medium', 'hard'
     */
    setDifficulty: function(level) {
        this.config.difficulty = level;
        
        switch(level) {
            case 'easy':
                this.config.searchDepth = 2;
                this.config.maxThinkTime = 10000;
                break;
            case 'medium':
                this.config.searchDepth = 3;
                this.config.maxThinkTime = 15000;
                break;
            case 'hard':
                this.config.searchDepth = 4;
                this.config.maxThinkTime = 20000;
                break;
        }
    },
    
    /**
     * 预留扩展接口：设置思考时间
     * @param {number} timeMs - 思考时间（毫秒）
     */
    setMaxThinkTime: function(timeMs) {
        this.config.maxThinkTime = timeMs;
    },
    
    /**
     * 预留扩展接口：设置搜索深度
     * @param {number} depth - 搜索深度
     */
    setSearchDepth: function(depth) {
        this.config.searchDepth = depth;
    },
});

// 导出单例
module.exports = new GobangAI();