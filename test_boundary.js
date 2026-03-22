/**
 * 测试边界情况下的玩家切换
 */

// 模拟Battle类的部分逻辑
function testBoundary() {
    console.log("测试边界情况下的玩家切换");
    
    // 模拟棋盘设置
    const mapWidth = 15;
    const mapHeight = 15;
    let map = [];
    let playerIdx = 1; // 1=黑子, 2=白子
    let gameOver = false;
    
    // 初始化棋盘
    for (let i = 0; i < mapHeight; i++) {
        map[i] = [];
        for (let j = 0; j < mapWidth; j++) {
            map[i][j] = 0;
        }
    }
    
    // 模拟_iswin函数
    function _iswin(pos) {
        let count = 0;
        let x = pos[0];
        let y = pos[1];
        let player = map[y][x];
        
        // 检查水平方向
        count = 0;
        x = pos[0];
        y = pos[1];
        while (true) {
            x--;
            if (x < 0) break;
            if (map[y][x] != player) break;
            count++;
        }
        x = pos[0];
        y = pos[1];
        while (true) {
            x++;
            if (x >= mapWidth) break;
            if (map[y][x] != player) break;
            count++;
        }
        if (count >= 4) return true;
        
        // 检查垂直方向
        count = 0;
        x = pos[0];
        y = pos[1];
        while (true) {
            y--;
            if (y < 0) break;
            if (map[y][x] != player) break;
            count++;
        }
        x = pos[0];
        y = pos[1];
        while (true) {
            y++;
            if (y >= mapHeight) break;
            if (map[y][x] != player) break;
            count++;
        }
        if (count >= 4) return true;
        
        // 检查右上斜方向
        count = 0;
        x = pos[0];
        y = pos[1];
        while (true) {
            x++;
            y--;
            if (x >= mapWidth || y < 0) break;
            if (map[y][x] != player) break;
            count++;
        }
        x = pos[0];
        y = pos[1];
        while (true) {
            x--;
            y++;
            if (x < 0 || y >= mapHeight) break;
            if (map[y][x] != player) break;
            count++;
        }
        if (count >= 4) return true;
        
        // 检查左上斜方向
        count = 0;
        x = pos[0];
        y = pos[1];
        while (true) {
            x--;
            y--;
            if (x < 0 || y < 0) break;
            if (map[y][x] != player) break;
            count++;
        }
        x = pos[0];
        y = pos[1];
        while (true) {
            x++;
            y++;
            if (x >= mapWidth || y >= mapHeight) break;
            if (map[y][x] != player) break;
            count++;
        }
        if (count >= 4) return true;
        
        return false;
    }
    
    // 模拟confirmPlaceChess函数
    function confirmPlaceChess(ipos) {
        if (gameOver) {
            console.log("游戏已结束，无法放置棋子");
            return false;
        }
        
        // 在棋盘数组中记录棋子
        map[ipos.y][ipos.x] = playerIdx;
        
        console.log(`放置棋子: (${ipos.x}, ${ipos.y}), 玩家: ${playerIdx == 1 ? "黑子" : "白子"}`);
        
        // 检查是否胜利
        let x = ipos.x;
        let y = ipos.y;
        let _pos = [x, y];
        if (_iswin(_pos)) {
            gameOver = true;
            console.log(`游戏结束！获胜方：${playerIdx == 1 ? "黑子" : "白子"}`);
            return true;
        } else {
            // 切换玩家
            playerIdx = (playerIdx == 1 ? 2 : 1);
            console.log(`切换玩家，当前玩家：${playerIdx == 1 ? "黑子" : "白子"}`);
            return false;
        }
    }
    
    // 测试1：在边界(0,0)放置黑子
    console.log("\n测试1：在边界(0,0)放置黑子");
    confirmPlaceChess({x: 0, y: 0});
    
    // 测试2：在边界(1,0)放置白子
    console.log("\n测试2：在边界(1,0)放置白子");
    confirmPlaceChess({x: 1, y: 0});
    
    // 测试3：在边界(0,1)放置黑子
    console.log("\n测试3：在边界(0,1)放置黑子");
    confirmPlaceChess({x: 0, y: 1});
    
    // 测试4：在边界(14,14)放置白子
    console.log("\n测试4：在边界(14,14)放置白子");
    confirmPlaceChess({x: 14, y: 14});
    
    // 测试5：在边界(14,13)放置黑子
    console.log("\n测试5：在边界(14,13)放置黑子");
    confirmPlaceChess({x: 14, y: 13});
    
    console.log("\n测试完成");
}

testBoundary();