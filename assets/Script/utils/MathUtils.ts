/**
 * MathUtils - 数学工具库
 * 封装向量运算、角度转换、距离计算、碰撞检测、插值与随机等功能
 * 
 * 使用场景：
 * - 向量运算：移动计算、方向判断、力的合成
 * - 距离计算：寻路、碰撞预筛选
 * - 碰撞检测：AABB矩形、圆形碰撞
 * - 插值动画：平滑过渡、缓动效果
 * - 随机生成：随机位置、随机方向
 */

// ==================== 向量类 ====================

/**
 * 二维向量
 * 用于表示游戏中的位置、速度、方向等
 */
export class Vector2 {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    /**
     * 克隆向量
     * @returns 新的 Vector2 实例
     */
    clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    /**
     * 设置向量值
     * @param x x分量
     * @param y y分量
     */
    set(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * 向量加法
     * @param v 要加的向量
     * @returns 结果向量
     * 
     * 使用场景：力的合成、位置累加
     */
    add(v: Vector2): Vector2 {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    /**
     * 向量减法
     * @param v 要减的向量
     * @returns 结果向量
     * 
     * 使用场景：计算两点间向量（方向）
     */
    sub(v: Vector2): Vector2 {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    /**
     * 向量数乘
     * @param scalar 标量
     * @returns 结果向量
     * 
     * 使用场景：速度缩放、位置偏移
     */
    mul(scalar: number): Vector2 {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    /**
     * 向量数除
     * @param scalar 标量（不能为0）
     * @returns 结果向量
     */
    div(scalar: number): Vector2 {
        if (scalar === 0) {
            cc.warn('[Vector2] div: 除数不能为0');
            return this.clone();
        }
        return new Vector2(this.x / scalar, this.y / scalar);
    }

    /**
     * 点积（内积）
     * @param v 另一个向量
     * @returns 点积结果
     * 
     * 使用场景：
     * - 判断两向量夹角：>0 锐角，=0 垂直，<0 钝角
     * - 判断方向：同向/反向
     * - 投影计算
     */
    dot(v: Vector2): number {
        return this.x * v.x + this.y * v.y;
    }

    /**
     * 叉积（外积，2D只返回标量）
     * @param v 另一个向量
     * @returns 叉积结果
     * 
     * 使用场景：
     * - 判断旋转方向：>0 逆时针，<0 顺时针
     * - 判断点在直线的哪一侧
     */
    cross(v: Vector2): number {
        return this.x * v.y - this.y * v.x;
    }

    /**
     * 向量长度（模）
     * @returns 长度
     * 
     * 使用场景：计算实际距离、归一化
     */
    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    /**
     * 向量长度的平方（性能更好，避免开方）
     * @returns 长度的平方
     * 
     * 使用场景：距离比较（不需要精确距离时）、碰撞预筛选
     */
    lengthSq(): number {
        return this.x * this.x + this.y * this.y;
    }

    /**
     * 归一化（转为单位向量）
     * @returns 归一化后的向量
     * 
     * 使用场景：获取方向、速度归一化
     */
    normalize(): Vector2 {
        const len = this.length();
        if (len === 0) {
            return new Vector2(0, 0);
        }
        return this.div(len);
    }

    /**
     * 绕原点旋转
     * @param angle 旋转角度（弧度）
     * @returns 旋转后的向量
     * 
     * 使用场景：角色朝向旋转、子弹轨迹
     */
    rotate(angle: number): Vector2 {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector2(
            this.x * cos - this.y * sin,
            this.x * sin + this.y * cos
        );
    }

    /**
     * 绕指定点旋转
     * @param angle 旋转角度（弧度）
     * @param pivot 旋转中心点
     * @returns 旋转后的向量
     * 
     * 使用场景：绕某物体旋转、卫星轨迹
     */
    rotateAround(angle: number, pivot: Vector2): Vector2 {
        const dx = this.x - pivot.x;
        const dy = this.y - pivot.y;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector2(
            pivot.x + dx * cos - dy * sin,
            pivot.y + dx * sin + dy * cos
        );
    }

    /**
     * 线性插值
     * @param target 目标向量
     * @param t 插值因子 [0,1]
     * @returns 插值结果
     * 
     * 使用场景：平滑移动、缓动动画
     */
    lerp(target: Vector2, t: number): Vector2 {
        return new Vector2(
            this.x + (target.x - this.x) * t,
            this.y + (target.y - this.y) * t
        );
    }

    /**
     * 转为字符串
     * @returns "(x, y)" 格式字符串
     */
    toString(): string {
        return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
    }

    /**
     * 是否与另一个向量相等（误差范围内）
     * @param v 另一个向量
     * @param epsilon 误差范围
     * @returns 是否相等
     */
    equals(v: Vector2, epsilon: number = 0.0001): boolean {
        return Math.abs(this.x - v.x) < epsilon && Math.abs(this.y - v.y) < epsilon;
    }

    /**
     * 转换为 cc.Vec2（与 Cocos 互转）
     * @returns cc.Vec2 对象
     */
    toCCVec2(): cc.Vec2 {
        return cc.v2(this.x, this.y);
    }

    /**
     * 从 cc.Vec2 创建
     * @param vec cc.Vec2 对象
     * @returns Vector2 实例
     */
    static fromCCVec2(vec: cc.Vec2): Vector2 {
        return new Vector2(vec.x, vec.y);
    }
}

// ==================== 静态方法 ====================

/**
 * 两点之间的距离
 * @param x1 点1 x
 * @param y1 点1 y
 * @param x2 点2 x
 * @param y2 点2 y
 * @returns 距离
 * 
 * 使用场景：检测碰撞、距离判断、范围检测
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 两点之间的距离（平方，性能更好，不开方）
 * @param x1 点1 x
 * @param y1 点1 y
 * @param x2 点2 x
 * @param y2 点2 y
 * @returns 距离的平方
 * 
 * 使用场景：
 * - 大量距离比较时使用，避免每帧调用开方
 * - 碰撞检测预筛选（先比较平方距离，再开方精确计算）
 */
export function distanceSq(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
}

/**
 * 两向量之间的距离
 * @param v1 向量1
 * @param v2 向量2
 * @returns 距离
 */
export function vectorDistance(v1: Vector2, v2: Vector2): number {
    return distance(v1.x, v1.y, v2.x, v2.y);
}

/**
 * 度数转弧度
 * @param deg 度数
 * @returns 弧度
 */
export function degToRad(deg: number): number {
    return deg * Math.PI / 180;
}

/**
 * 弧度转度数
 * @param rad 弧度
 * @returns 度数
 */
export function radToDeg(rad: number): number {
    return rad * 180 / Math.PI;
}

/**
 * 计算两向量夹角（弧度）
 * @param v1 向量1
 * @param v2 向量2
 * @returns 夹角（弧度）
 * 
 * 使用场景：攻击角度计算、视野范围判断
 */
export function angleBetween(v1: Vector2, v2: Vector2): number {
    const dot = v1.dot(v2);
    const len1 = v1.length();
    const len2 = v2.length();
    if (len1 === 0 || len2 === 0) return 0;
    const cos = Math.max(-1, Math.min(1, dot / (len1 * len2)));
    return Math.acos(cos);
}

/**
 * 计算两向量夹角（度数）
 * @param v1 向量1
 * @param v2 向量2
 * @returns 夹角（度数）
 */
export function angleBetweenDeg(v1: Vector2, v2: Vector2): number {
    return radToDeg(angleBetween(v1, v2));
}

/**
 * 点到直线的距离
 * @param px 点 x
 * @param py 点 y
 * @param x1 直线起点 x
 * @param y1 直线起点 y
 * @param x2 直线终点 x
 * @param y2 直线终点 y
 * @returns 最短距离
 * 
 * 使用场景：路径检测、边界判断
 */
export function pointToLineDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    const param = dot / lenSq;
    let xx, yy;
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    return distance(px, py, xx, yy);
}

/**
 * 点是否在矩形内
 * @param px 点 x
 * @param py 点 y
 * @param rx 矩形 x
 * @param ry 矩形 y
 * @param rw 矩形宽度
 * @param rh 矩形高度
 * @returns 是否在矩形内
 * 
 * 使用场景：点击区域检测、碰撞判定
 */
export function pointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * 两矩形是否相交
 * @param x1 矩形1 x
 * @param y1 矩形1 y
 * @param w1 矩形1 宽
 * @param h1 矩形1 高
 * @param x2 矩形2 x
 * @param y2 矩形2 y
 * @param w2 矩形2 宽
 * @param h2 矩形2 高
 * @returns 是否相交
 * 
 * 使用场景：AABB 碰撞检测
 */
export function rectIntersect(x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

/**
 * 两圆是否相交
 * @param x1 圆1圆心x
 * @param y1 圆1圆心y
 * @param r1 圆1半径
 * @param x2 圆2圆心x
 * @param y2 圆2圆心y
 * @param r2 圆2半径
 * @returns 是否相交
 * 
 * 使用场景：圆形碰撞检测、范围判定
 */
export function circleIntersect(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
    const distSq = distanceSq(x1, y1, x2, y2);
    const radiusSum = r1 + r2;
    return distSq <= radiusSum * radiusSum;
}

/**
 * 点是否在圆内
 * @param px 点 x
 * @param py 点 y
 * @param cx 圆心 x
 * @param cy 圆心 y
 * @param r 半径
 * @returns 是否在圆内
 * 
 * 使用场景：圆形点击检测、半径范围判定
 */
export function pointInCircle(px: number, py: number, cx: number, cy: number, r: number): boolean {
    return distanceSq(px, py, cx, cy) <= r * r;
}

/**
 * 线性插值
 * @param start 起始值
 * @param end 结束值
 * @param t 插值因子 [0,1]
 * @returns 插值结果
 * 
 * 使用场景：
 * - 动画平滑过渡
 * - 数值缓动
 * - 颜色渐变
 */
export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

/**
 * 限制数值在范围内
 * @param value 当前值
 * @param min 最小值
 * @param max 最大值
 * @returns 限制后的值
 * 
 * 使用场景：血量限制、移动边界限制
 */
export function clamp(value: number, min: number, max: number): number {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

/**
 * 限制数值在 0-1 范围
 * @param value 当前值
 * @returns 限制后的值
 */
export function clamp01(value: number): number {
    return clamp(value, 0, 1);
}

/**
 * 随机浮点数
 * @param min 最小值
 * @param max 最大值
 * @returns 随机浮点数
 * 
 * 使用场景：随机位置、随机偏移
 */
export function randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

/**
 * 随机整数
 * @param min 最小值（包含）
 * @param max 最大值（包含）
 * @returns 随机整数
 * 
 * 使用场景：随机选择、随机步进
 */
export function randomInt(min: number, max: number): number {
    return Math.floor(randomRange(min, max + 1));
}

/**
 * 矩形内随机点
 * @param rx 矩形 x
 * @param ry 矩形 y
 * @param rw 矩形宽
 * @param rh 矩形高
 * @returns 随机点 Vector2
 * 
 * 使用场景：随机生成出生点、随机移动目标
 */
export function randomPointInRect(rx: number, ry: number, rw: number, rh: number): Vector2 {
    return new Vector2(randomRange(rx, rx + rw), randomRange(ry, ry + rh));
}

/**
 * 圆内随机点
 * @param cx 圆心 x
 * @param cy 圆心 y
 * @param r 半径
 * @returns 随机点 Vector2
 * 
 * 使用场景：随机生成圆形区域内的点
 */
export function randomPointInCircle(cx: number, cy: number, r: number): Vector2 {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.sqrt(Math.random()) * r;
    return new Vector2(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
}

/**
 * 随机角度（弧度）
 * @returns 随机弧度 [0, 2π)
 */
export function randomAngle(): number {
    return Math.random() * Math.PI * 2;
}

/**
 * 随机单位向量
 * @returns 随机方向的单位向量
 * 
 * 使用场景：随机方向移动、随机朝向
 */
export function randomDirection(): Vector2 {
    const angle = randomAngle();
    return new Vector2(Math.cos(angle), Math.sin(angle));
}

/**
 * 缓动函数 - 缓入
 * @param t 插值因子 [0,1]
 * @returns 缓动结果
 */
export function easeIn(t: number): number {
    return t * t;
}

/**
 * 缓动函数 - 缓出
 * @param t 插值因子 [0,1]
 * @returns 缓动结果
 */
export function easeOut(t: number): number {
    return 1 - (1 - t) * (1 - t);
}

/**
 * 缓动函数 - 缓入缓出
 * @param t 插值因子 [0,1]
 * @returns 缓动结果
 */
export function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export default {
    Vector2,
    distance,
    distanceSq,
    vectorDistance,
    degToRad,
    radToDeg,
    angleBetween,
    angleBetweenDeg,
    pointToLineDist,
    pointInRect,
    rectIntersect,
    circleIntersect,
    pointInCircle,
    lerp,
    clamp,
    clamp01,
    randomRange,
    randomInt,
    randomPointInRect,
    randomPointInCircle,
    randomAngle,
    randomDirection,
    easeIn,
    easeOut,
    easeInOut
};