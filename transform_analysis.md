# Coordinate Transformation Analysis & Calibration Plan

## 问题分析

### 当前线性模型失效的根本原因

1. **非均匀缩放/剪切变形**：棋盘可能使用等距或透视投影，导致 `y` 方向的映射非线性
2. **节点层级复合变换**：`convertToNodeSpaceAR` 包含父节点的所有变换（旋转、缩放、平移）
3. **锚点偏移**：棋盘格子与像素边界不完全对齐
4. **非线性畸变**：实测 `rawY` 异常（0.634 vs 12.879）表明存在 `y' = a*y² + b*y + c` 类型的映射

现有代码假设变换是仿射线性的：
```typescript
rawX = (posInBattleLayer.x - ndBase.x + chessWidth/2) / chessWidth
rawY = (posInBattleLayer.y - ndBase.y + chessHeight/2) / chessHeight
```

当变换包含**透视畸变**或**非均匀缩放**时，此假设失效。

## 正确建模方法

根据 Cocos Creator 2D 引擎文档，正确的建模应使用 **4×4 变换矩阵**：
- `Node.getNodeToWorldTransformAR()`：返回世界坐标变换矩阵（包含旋转、缩放、平移）
- `Mat4` 矩阵运算：支持矩阵求逆、拼接
- **仿射变换**：处理平移、旋转、缩放，但**不支持透视**

对于透视/斜切投影，需要使用**齐次坐标**和**4×4 矩阵**求解。

## 校准流程

### 阶段 1：控制点采集
```typescript
// 采集 N 对 (屏幕坐标, 棋盘索引)，N ≥ 4
const controlPoints: { screen: cc.Vec2, board: ChessPosition }[] = []
```

### 阶段 2：最小二乘求解
构建线性方程组求解仿射变换参数 `[a,b,c,d,e,f]`：
- `screenX = a*boardX + b*boardY + c`
- `screenY = d*boardX + e*boardY + f`

```typescript
// 构建设计矩阵 A 和观测向量 B
// 解方程：A × params = B  →  params = (A^T A)^(-1) A^T B
this.transformParams = this.solveLeastSquares(A, B)
```

### 阶段 3：残差评估
```typescript
// 计算 RMS 误差
const rms = sqrt(sum((screenX_measured - screenX_predicted)²) / N)
// 接受阈值：RMS < 2 像素
```

### 阶段 4：回退策略
- 若残差过大 → 使用最近控制点直接查找（无插值）
- 记录调试日志供分析

## 实现伪代码

### 校准阶段（初始化时执行）
```typescript
private calibrateTransform(): void {
    const points = this.collectControlPoints(); // 手动选取或自动校准
    
    const A: number[][] = []; // 设计矩阵
    const B: number[] = [];   // 观测向量
    
    for (const pt of points) {
        const b = pt.board;
        const s = pt.screen;
        A.push([b.x, b.y, 1, 0, 0, 0]);
        A.push([0, 0, 0, b.x, b.y, 1]);
        B.push(s.x);
        B.push(s.y);
    }
    
    // 求解 6 未知数线性方程组
    this.transformCoeffs = this.linearSolve6x6(A, B);
}
```

### 实时坐标转换
```typescript
private getBoardIndexFromScreen(screenPos: cc.Vec2): ChessPosition {
    const [a,b,c,d,e,f] = this.transformCoeffs;
    const boardX = a*screenPos.x + b*screenPos.y + c;
    const boardY = d*screenPos.x + e*screenPos.y + f;
    
    return {
        x: Math.floor(boardX),
        y: Math.floor(boardY)
    };
}
```

### 集成点
1. **替换** `touchBegan` 中的坐标计算（原代码第 363-364 行）
2. **新增** `calibrateTransform()` 在 `initView()` 或 `onShow()` 调用
3. **保留** `getChessPosition()` 用于已验证的棋盘索引

## 注意事项
- **勿假设线性**：始终用控制点验证变换
- **精确变换**：若棋盘严格轴对齐，可用 `Mat4.invert()` 直接求逆
- **透视畸变**：需 ≥4 控制点求解 8×8 方程组
- **性能**：校准只做一次，实时计算使用预求解参数