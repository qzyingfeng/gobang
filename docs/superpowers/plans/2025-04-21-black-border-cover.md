# 黑边覆盖实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 动态检测并覆盖屏幕缩放产生的黑边，保持界面美观

**Architecture:** 
1. 先生成50x50格子图片
2. 创建ScreenAdapter.js统一管理适配和黑边覆盖
3. 在各场景加载时调用适配逻辑

**Tech Stack:** Cocos Creator 2.4.3, JavaScript

---

### Task 1: 生成格子图片

**Files:**
- Create: `assets/Texture/GridCell.png` (50x50纯色格子图片)
- Modify: `assets/Texture/GridCell.png.meta`

- [ ] **Step 1: 创建50x50纯色格子图片**
使用米黄色（#E8D4B8）与棋盘背景协调

---

### Task 2: 创建ScreenAdapter适配脚本

**Files:**
- Create: `assets/Script/ScreenAdapter.js`
- Modify: `settings/project.json` (可选：修改适配策略为fit-width)

- [ ] **Step 1: 编写ScreenAdapter.js**

```javascript
/**
 * 屏幕适配脚本
 * 统一管理屏幕适配和黑边覆盖
 */

const ScreenAdapter = {
    // 格子大小
    CELL_SIZE: 50,
    // 格子节点池
    gridPool: [],
    // 格子对象池最大数量
    POOL_MAX_SIZE: 20,

    /**
     * 初始化屏幕适配
     * 在场景加载时调用
     */
    init() {
        this.checkAndCoverBlackBorder();
    },

    /**
     * 检测并覆盖黑边
     */
    checkAndCoverBlackBorder() {
        // 获取Canvas尺寸
        const canvas = cc.find('Canvas');
        if (!canvas) return;

        const designWidth = 960;
        const designHeight = 640;
        
        // 获取实际屏幕尺寸
        const screenWidth = cc.winSize.width;
        const screenHeight = cc.winSize.height;
        
        // 计算缩放后的画布尺寸
        const scaleX = screenWidth / designWidth;
        const scaleY = screenHeight / designHeight;
        const scaledWidth = designWidth * scaleY;
        const scaledHeight = designHeight * scaleY;
        
        // 计算黑边
        const paddingX = (screenWidth - scaledWidth) / 2;
        const paddingY = (screenHeight - scaledHeight) / 2;
        
        // 覆盖上下黑边
        if (paddingY > 0) {
            this.coverTopBorder(paddingY);
            this.coverBottomBorder(paddingY);
        }
    },

    /**
     * 覆盖顶部黑边
     */
    coverTopBorder(padding) {
        const cellSize = this.CELL_SIZE;
        const rows = Math.ceil(padding / cellSize);
        const cols = Math.ceil(cc.winSize.width / cellSize);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const node = this.getGridNode();
                node.setPosition(
                    col * cellSize - cc.winSize.width / 2 + cellSize / 2,
                    cc.winSize.height / 2 - padding + row * cellSize + cellSize / 2
                );
                node.zIndex = -100; // 最底层
            }
        }
    },

    /**
     * 覆盖底部黑边
     */
    coverBottomBorder(padding) {
        const cellSize = this.CELL_SIZE;
        const rows = Math.ceil(padding / cellSize);
        const cols = Math.ceil(cc.winSize.width / cellSize);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const node = this.getGridNode();
                node.setPosition(
                    col * cellSize - cc.winSize.width / 2 + cellSize / 2,
                    -cc.winSize.height / 2 + padding - row * cellSize - cellSize / 2
                );
                node.zIndex = -100;
            }
        }
    },

    /**
     * 从对象池获取格子节点
     */
    getGridNode() {
        let node = null;
        if (this.gridPool.length > 0) {
            node = this.gridPool.pop();
            node.active = true;
        } else {
            node = new cc.Node('GridCell');
            node.addComponent(cc.Sprite);
            node.getComponent(cc.Sprite).spriteFrame = 
                cc.resources.get('GridCell', cc.SpriteFrame);
        }
        node.parent = cc.find('Canvas');
        return node;
    },

    /**
     * 回收所有格子到对象池
     */
    recycleAll() {
        for (const node of this.gridPool) {
            node.active = false;
        }
    }
};

window.ScreenAdapter = ScreenAdapter;
```

- [ ] **Step 2: 在Login场景调用**

在Login.js的start()方法开头添加:
```javascript
if (window.ScreenAdapter) {
    ScreenAdapter.init();
}
```

- [ ] **Step 3: 在Battle场景调用**

在Battle.js的onLoad()方法开头添加同样的调用

---

### Task 3: 预加载格子资源

**Files:**
- Modify: `assets/Script/GameConfig.js` 或 `assets/Script/Login.js`

- [ ] **Step 1: 预加载格子资源**

在游戏开始前预加载GridCell图片:
```javascript
cc.resources.load('Texture/GridCell', cc.SpriteFrame);
```

---

**Plan complete and saved to `docs/superpowers/plans/2025-04-21-black-border-cover.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**