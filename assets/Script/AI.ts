/**
 * 五子棋 AI - 单例（窗口计数最终版）
 */

interface Point { x: number; y: number; }

const DIRECTIONS: [number, number][] = [[1, 0], [0, 1], [1, 1], [1, -1]];
const WIN = 10000000;

class AIClass {
    private static instance: AIClass;
    private depth = 6;
    private timeLimit = 5000;
    private canceled = false;
    // 防守系数：对手威胁放大倍数
    private defenseRatio = 1.8;

    static getInstance(): AIClass {
        if (!this.instance) this.instance = new AIClass();
        return this.instance;
    }

    setDifficulty(level:string): void {
        if (level === 'easy')   { this.depth = 2; this.timeLimit = 1000; this.defenseRatio = 1.2; }
        if (level === 'medium') { this.depth = 4; this.timeLimit = 3000; this.defenseRatio = 1.5; }
        if (level === 'hard')   { this.depth = 6; this.timeLimit = 5000; this.defenseRatio = 1.8; }
    }

    cancel(): void { this.canceled = true; }

    async getBestMove(board: number[][], player: number): Promise<Point> {
        this.canceled = false;
        const deadline = Date.now() + this.timeLimit;
        const opp = 3 - player;
        const moves = this.genMoves(board);

        if (moves.length === 0) return { x: 7, y: 7 };

        // 直接赢
        for (const m of moves) {
            if (this.hasFive(this.setCell(board, m, player), player)) return m;
        }
        // 堵对手五连
        for (const m of moves) {
            if (this.hasFive(this.setCell(board, m, opp), opp)) return m;
        }

        // 堵活三/冲四：用完整评估扫一遍
        let bestBlock: Point | null = null;
        let maxBlockScore = 0;
        for (const m of moves) {
            const b = this.setCell(board, m, opp);
            const s = this.evaluate(b, opp);
            if (s >= 5000 && s > maxBlockScore) {
                maxBlockScore = s;
                bestBlock = m;
            }
        }
        if (bestBlock) return bestBlock;

        // 迭代加深
        let best = moves[0];
        for (let d = 1; d <= this.depth; d++) {
            if (Date.now() > deadline || this.canceled) break;
            const r = await this.deepSearch(board, player, moves, d, deadline);
            if (r) best = r;
        }
        return best;
    }

    private deepSearch(
        board: number[][], player: number,
        moves: Point[], depth: number, deadline: number
    ): Promise<Point | null> {
        return new Promise(resolve => {
            setTimeout(() => {
                const ordered = this.sortMoves(board, moves, player).slice(0, 20);
                let bestScore = -Infinity;
                let bestMove: Point | null = null;
                for (const m of ordered) {
                    if (Date.now() > deadline || this.canceled) break;
                    const score = -this.negamax(
                        this.setCell(board, m, player), depth - 1,
                        -Infinity, Infinity, 3 - player, deadline
                    );
                    if (score > bestScore) { bestScore = score; bestMove = m; }
                }
                resolve(bestMove);
            }, 0);
        });
    }

    private negamax(
        board: number[][], depth: number,
        alpha: number, beta: number, player: number, deadline: number
    ): number {
        if (Date.now() > deadline || this.canceled) return 0;
        if (depth === 0) return this.evaluate(board, player);

        const opp = 3 - player;
        if (this.hasFive(board, opp)) return -(WIN + depth);

        const moves = this.genMoves(board);
        if (moves.length === 0) return 0;

        let best = -Infinity;
        for (const m of moves) {
            if (Date.now() > deadline) break;
            const score = -this.negamax(
                this.setCell(board, m, player), depth - 1, -beta, -alpha, opp, deadline
            );
            best = Math.max(best, score);
            alpha = Math.max(alpha, score);
            if (alpha >= beta) break;
        }
        return best;
    }

    /** 评估：扫描所有5连窗口，数子打分 */
    private evaluate(board: number[][], player: number): number {
        const opp = 3 - player;
        let score = 0;
        for (const line of this.lines(board)) {
            score += this.lineEval(line, player, opp);
        }
        return score;
    }

    private lineEval(line: number[], me: number, opp: number): number {
        let score = 0;
        const len = line.length;

        for (let i = 0; i <= len - 5; i++) {
            let mine = 0, theirs = 0;
            for (let j = 0; j < 5; j++) {
                if (line[i + j] === me) mine++;
                else if (line[i + j] === opp) theirs++;
            }
            if (mine > 0 && theirs > 0) continue; // 混色窗口跳过

            if (theirs === 0 && mine > 0) {
                score += this.windowScore(line, i, mine, false);
            }
            if (mine === 0 && theirs > 0) {
                score -= this.windowScore(line, i, theirs, true);
            }
        }
        return score;
    }

    /** 窗口分：结合两端开口情况 */
    private windowScore(line: number[], start: number, count: number, isOpp: boolean): number {
        const L = start > 0 && line[start - 1] === 0;
        const R = start + 5 < line.length && line[start + 5] === 0;
        const openEnds = (L ? 1 : 0) + (R ? 1 : 0);

        let base = 0;
        if (count === 5) base = WIN;
        else if (count === 4) {
            if (openEnds === 2) base = WIN;       // 活四 = 赢了
            else if (openEnds === 1) base = 10000; // 冲四
            else base = 0;                          // 死四
        } else if (count === 3) {
            if (openEnds === 2) base = 5000;       // 活三
            else if (openEnds === 1) base = 500;   // 眠三
            else base = 0;                          // 死三
        } else if (count === 2) {
            if (openEnds === 2) base = 200;        // 活二
            else if (openEnds === 1) base = 20;    // 眠二
            else base = 0;
        } else if (count === 1) {
            base = openEnds >= 1 ? 1 : 0;
        }

        // 对手威胁放大
        return isOpp ? base * this.defenseRatio : base;
    }

    private lines(board: number[][]): number[][] {
        const n = board.length;
        const result: number[][] = [];

        for (let y = 0; y < n; y++) result.push(board[y].slice());
        for (let x = 0; x < n; x++) {
            const col: number[] = [];
            for (let y = 0; y < n; y++) col.push(board[y][x]);
            result.push(col);
        }
        for (let d = -n + 1; d < n; d++) {
            const l: number[] = [];
            for (let i = 0; i < n; i++) { const x = d + i, y = i; if (x >= 0 && x < n) l.push(board[y][x]); }
            if (l.length >= 5) result.push(l);
        }
        for (let d = 0; d < 2 * n - 1; d++) {
            const l: number[] = [];
            for (let i = 0; i < n; i++) { const x = d - i, y = i; if (x >= 0 && x < n) l.push(board[y][x]); }
            if (l.length >= 5) result.push(l);
        }
        return result;
    }

    private genMoves(board: number[][]): Point[] {
        const n = board.length;
        const seen = new Set<number>();
        const pts: Point[] = [];
        let empty = true;

        for (let y = 0; y < n; y++) {
            for (let x = 0; x < n; x++) {
                if (!board[y][x]) continue;
                empty = false;
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const nx = x + dx, ny = y + dy;
                        if (nx < 0 || nx >= n || ny < 0 || ny >= n || board[ny][nx]) continue;
                        const k = ny * n + nx;
                        if (!seen.has(k)) { seen.add(k); pts.push({ x: nx, y: ny }); }
                    }
                }
            }
        }
        return empty ? [{ x: n >> 1, y: n >> 1 }] : pts;
    }

    private sortMoves(board: number[][], moves: Point[], player: number): Point[] {
        const opp = 3 - player;
        const n = board.length;
        const center = n >> 1;

        // 预计算防守分
        const blockScore = new Map<number, number>();
        for (const m of moves) {
            const b = this.setCell(board, m, opp);
            blockScore.set(m.y * n + m.x, this.evaluate(b, opp));
        }

        return [...moves].sort((a, b) => {
            const ka = a.y * n + a.x, kb = b.y * n + b.x;
            const ba = blockScore.get(ka)!, bb = blockScore.get(kb)!;
            if (ba !== bb) return bb - ba;
            const pa = this.quickEval(board, a, player);
            const pb = this.quickEval(board, b, player);
            if (pa !== pb) return pb - pa;
            return (Math.abs(a.x - center) + Math.abs(a.y - center)) -
                   (Math.abs(b.x - center) + Math.abs(b.y - center));
        });
    }

    private quickEval(board: number[][], p: Point, player: number): number {
        let s = 0;
        board[p.y][p.x] = player;
        const opp = 3 - player;
        for (const [dx, dy] of DIRECTIONS) {
            s += this.lineEval(this.extractLine(board, p.x, p.y, dx, dy), player, opp);
        }
        board[p.y][p.x] = 0;
        return s;
    }

    private extractLine(board: number[][], x: number, y: number, dx: number, dy: number): number[] {
        const n = board.length;
        const l = [board[y][x]];
        let nx = x + dx, ny = y + dy;
        while (nx >= 0 && nx < n && ny >= 0 && ny < n) { l.push(board[ny][nx]); nx += dx; ny += dy; }
        nx = x - dx; ny = y - dy;
        while (nx >= 0 && nx < n && ny >= 0 && ny < n) { l.unshift(board[ny][nx]); nx -= dx; ny -= dy; }
        return l;
    }

    private hasFive(board: number[][], player: number): boolean {
        const n = board.length;
        for (let y = 0; y < n; y++) {
            for (let x = 0; x < n; x++) {
                if (board[y][x] !== player) continue;
                for (const [dx, dy] of DIRECTIONS) {
                    let cnt = 1;
                    let nx = x + dx, ny = y + dy;
                    while (nx >= 0 && nx < n && ny >= 0 && ny < n && board[ny][nx] === player) { cnt++; nx += dx; ny += dy; }
                    if (cnt >= 5) return true;
                }
            }
        }
        return false;
    }

    private setCell(board: number[][], p: Point, v: number): number[][] {
        const next = board.map(r => [...r]);
        next[p.y][p.x] = v;
        return next;
    }
}

const AI = AIClass.getInstance();
export default AI;