/**
 * 测试胜利判断逻辑
 * 用于验证五子连珠判断是否正确
 */

// 测试用例
function testWinLogic() {
    console.log("开始测试胜利判断逻辑");
    
    // 模拟棋盘
    let map = [];
    for (let i = 0; i < 15; i++) {
        map[i] = [];
        for (let j = 0; j < 15; j++) {
            map[i][j] = 0;
        }
    }
    
    // 测试水平方向五子连珠
    console.log("测试水平方向五子连珠");
    // 在第7行放置5个黑子
    for (let i = 5; i < 10; i++) {
        map[7][i] = 1;
    }
    
    // 检查位置(7,7)是否胜利
    let player = 1;
    let pos = [7, 7];
    let count = 0;
    let x = pos[0];
    let y = pos[1];
    
    // 向左检查
    while (true) {
        x--;
        if (x < 0) break;
        if (map[y][x] != player) break;
        ++count;
    }
    // 向右检查
    x = pos[0];
    y = pos[1];
    while (true) {
        x++;
        if (x >= 15) break;
        if (map[y][x] != player) break;
        ++count;
    }
    console.log("水平方向count:", count, "应该 >= 4:", count >= 4);
    
    // 测试垂直方向五子连珠
    console.log("测试垂直方向五子连珠");
    // 重置棋盘
    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            map[i][j] = 0;
        }
    }
    // 在第7列放置5个黑子
    for (let i = 5; i < 10; i++) {
        map[i][7] = 1;
    }
    
    // 检查位置(7,7)是否胜利
    count = 0;
    x = pos[0];
    y = pos[1];
    
    // 向上检查
    while (true) {
        y--;
        if (y < 0) break;
        if (map[y][x] != player) break;
        ++count;
    }
    // 向下检查
    x = pos[0];
    y = pos[1];
    while (true) {
        y++;
        if (y >= 15) break;
        if (map[y][x] != player) break;
        ++count;
    }
    console.log("垂直方向count:", count, "应该 >= 4:", count >= 4);
    
    console.log("测试完成");
}

// 运行测试
testWinLogic();