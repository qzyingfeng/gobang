# AGENTS.md

## 全局规则

### 语言要求
- **必须使用中文回复** - 所有回复都必须使用中文
- **代码注释** - 代码注释必须使用中文
- **错误信息** - 错误信息和日志必须使用中文
- **用户交互** - 与用户的所有交互必须使用中文

### 新对话必读文件
> ⚠️ **每次新对话开始时，必须先读取以下文件：**

| 文件 | 作用 |
|------|------|
| [项目文件.md](项目文件.md) | 项目整体框架、目录结构、文件说明 |
| [cocos注意事项.md](cocos注意事项.md) | Cocos 废弃接口、版本限制、常见坑点 |
| [开发规范与错误记录.md](开发规范与错误记录.md) | 开发规范、错误教训、检查清单 |

## 项目概述

| 项目信息 | 内容 |
|---------|------|
| 类型 | Cocos Creator 2.4.3 游戏项目（五子棋） |
| 语言 | TypeScript |
| 模块系统 | ES6 import/export |
| 引擎 | Cocos2d-html5 |
| 平台 | 移动端网页 |

## 目录结构

```
assets/
├── Script/
│   ├── base/              # 基类（BaseUI、BasePage、BasePopup）
│   ├── manager/            # 管理器（UIManager、PopupManager、TipManager 等）
│   ├── utils/              # 工具函数
│   ├── Main.ts            # 主场景入口
│   ├── LoginLayer.ts      # 登录界面
│   ├── SettingLayer.ts   # 设置界面
│   └── config/            # 配置表
├── Prefab/                # 预制体资源
├── Scene/                 # .fire 场景文件
└── resources/             # 音频等资源
```

## 构建、测试和代码检查命令

### 构建
```bash
# 通过 Cocos Creator 编辑器 GUI 构建：
# 项目 -> 构建 -> 选择平台 -> 构建
# 无命令行构建方式
```

### 测试
```bash
# 未配置正式测试框架
# 通过 Cocos Creator 预览进行手动测试：
# 1. 打开 Cocos Creator
# 2. 点击"预览"按钮或按 Ctrl+P
# 3. 在浏览器中测试

# 纯逻辑测试（独立运行）：
node test_win_logic.js
```

### 代码检查
```bash
# 未配置代码检查工具
# 仅手动代码审查
```

## 代码风格指南

### 组件模式（TypeScript + 装饰器）

> **注意**：使用 ES6 import/export 模块系统，通过装饰器 `@ccclass` 注册组件。

```typescript
import BaseUI from './base/BaseUI';

const { ccclass } = cc._decorator;

@ccclass
export default class LoginLayer extends BaseUI {
    // 编辑器暴露的属性，带类型注释
    private prefabName: cc.Prefab = null;
    private nodeName: cc.Node = null;
    private labelName: cc.Label = null;
    private valueName: 0 | 1 = 0;                    // 数值类型
    private textName: "" | "default" = "";            // 字符串类型
    private flagName: boolean = false;             // 布尔类型
    private spriteFrames: cc.SpriteFrame[] = []; // 数组类型

    onLoad() { /* 初始化 */ },
    start() { /* 首次激活逻辑 */ },
    onDestroy() { /* 清理 */ },
}
```

### 模块系统（ES6 import/export）

```typescript
// 导出
import BaseUI from './base/BaseUI';

// 导入时不能加 .ts 后缀
```

### 文件结构
```
assets/
├── Script/        # TypeScript 游戏逻辑
├── Scene/         # .fire 场景文件
├── Prefab/        # 可复用预制体
└── Texture/       # 图片资源
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件类 | PascalCase | `WinPopupManager` |
| 文件名 | PascalCase | `Battle.ts`, `Chess.ts` |
| 属性 | camelCase | `chessWidth`, `mapHeight` |
| 私有方法 | 下划线前缀 | `_iswin()`, `_getChessPosition()` |
| 事件处理 | on 前缀 | `onRestartClick()`, `onReturn()` |
| 布尔标志 | is/has 前缀 | `isPopupShowing`, `gameOver` |
| 节点引用 | nd 前缀 | `ndBase`, `ndChess` |
| 精灵帧 | spt 前缀 | `sptFrames` |

### 导入与依赖
```typescript
// 使用 ES6 import 导入
import BaseUI from './base/BaseUI';
import UIManager from './manager/UIManager';

// Cocos Creator 组件引用（通过装饰器自动注册）
@ccclass
export default class MyComponent extends BaseUI {
    // 通过字符串名称获取其他组件
    private otherComp = this.getComponent("OtherComponent");
}
```

### 事件处理
```typescript
// 在 start() 或 onLoad() 中注册事件
this.node.on(cc.Node.EventType.TOUCH_START, this.touchBegan, this);

// 在 onDestroy() 中清理
this.node.off(cc.Node.EventType.TOUCH_START, this.touchBegan, this);
```

### 坐标系统
```typescript
// 屏幕到节点空间转换
let posScreen = evt.getLocation();
let posNode = this.node.convertToNodeSpaceAR(posScreen);

// 使用 cc.v2() 创建 Vec2
let position = cc.v2(x, y);
```

### 错误处理
```typescript
// 使用 cc.error() 处理错误，cc.warn() 处理警告
if (invalidCondition) {
    cc.error("错误信息：", details);
    return;
}

// 访问前验证数组边界
if (x < 0 || x >= this.mapWidth) break;
```

### 注释
```typescript
// 代码库中接受中文注释
// 对公共方法使用 JSDoc：

/**
 * 方法功能描述
 * @param {Type} paramName - 参数说明
 * @returns {Type} 返回值说明
 */
methodName(paramName) {
    // 单行注释解释逻辑
}
```

### 控制台日志
```typescript
// 使用 cc.log() 或 console.log() 进行调试
cc.log("调试信息：", value);
console.log("游戏状态：", this.playerIdx);
```

## 核心模式

### 状态管理
```typescript
// 在 onLoad() 中初始化状态
onLoad() {
    this.playerIdx = 1;       // 1=黑子, 2=白子
    this.gameOver = false;
    this.map = [];            // 棋盘状态的二维数组
}
```

### 节点生命周期
```typescript
// 始终清理监听器
onDestroy() {
    this.node.off(cc.Node.EventType.TOUCH_START, this.handler, this);
}
```

### 场景导航
```typescript
// 使用 cc.director.loadScene()
cc.director.loadScene("Login");
cc.director.loadScene("Battle");
```

## 重要说明

- **无自动化测试** - 编辑器预览中手动测试
- **无代码检查** - 遵循现有代码风格
- **中文注释** - 整个代码库使用中文注释
- **游戏逻辑**：`count >= 4` 表示五子连珠（count 不包含当前落子）

## 协作规则

### 0. 搜索验证优先（⚠️ 每次必做）
- **每次用户给出需求时**，必须先搜索官网/社区确认参考实现
- 特别是 Cocos API 调用，**必须先确认接口是否已废弃**
- 如发现废弃接口，**必须记录在 cocos注意事项.md**
- 搜索渠道：Cocos 官方文档、GitHub、Stack Overflow、社区论坛

### 1. 项目完成时同步文档（⚠️ 每次必做）
- **当项目功能确定完成时**，必须提醒用户更新 `项目文件.md`
- 需要更新内容包括：
  - 新增脚本文件及其功能说明
  - 新增预制体或资源
  - 新增场景或场景功能变化
  - 文件依赖关系变化
  - 核心算法或逻辑的重大变更
- **操作**：在任务完成时主动提示用户："项目有新变化，需要更新项目文件.md吗？"

### 2. 搜索模式
- **最大化搜索力度** — 并行启动多个后台代理：
  - 探索代理（代码库模式、文件结构、ast-grep）
  - 资料代理（远程仓库、官方文档、GitHub 示例）
- 直接工具：Grep、ast-grep (sg)
- **永不满足于首个结果** — 追求彻底性

### 3. 先阅读，避免重复造轮
- 新增功能前，先扫描项目现有代码，查找相似逻辑、工具类、组件或预制体
- 优先复用、扩展现有模块

### 4. 文件操作前必须询问
- 任何文件的创建、修改、删除，必须先向用户确认，说明操作原因和影响
- 删除或覆盖前特别提醒风险，必要时建议备份或版本控制

### 5. 先计划，再行动
- 动手编码前，先给出实现计划（涉及文件、关键逻辑、潜在风险、性能考量）
- 等确认后，再逐步输出代码或修改

### 6. 遵守面向对象开发原则
- 遵循单一职责、开闭原则、依赖倒置等 OOP 原则
- 合理划分组件与数据模型，避免"上帝类"
- 通过接口、继承或组合提高可维护性

### 7. 考虑性能问题
- 关注帧率敏感操作（如 update 中的高频计算、节点创建/销毁）
- 优先使用对象池管理频繁生成的节点
- 避免在 update 中频繁查找节点或组件，缓存常用引用
- 合理使用脏标记、事件驱动代替轮询

### 8. 遵循 Cocos Creator 2D 开发原则
- 场景管理遵循 场景-预制体-资源 分离，减少耦合
- 资源按需加载，避免首场景过重
- 动画优先使用动画组件或缓动系统
- 注意层级（zIndex）、批处理（合图）优化

### 9. 错误处理与边界条件
- 对输入参数、外部依赖（网络、资源加载）做异常捕获和降级处理
- 组件生命周期（onLoad、onEnable、start、onDestroy）中处理好空引用和组件顺序依赖

### 10. 资源与内存管理
- 动态加载的资源必须及时释放（assetManager.releaseAsset 等）
- 明确 node.destroy() 与 removeFromParent 的区别，避免资源残留
- 对象池中对象重置干净，防止状态污染

### 11. 版本控制与协作友好
- 代码风格统一（缩进、命名规范），避免冲突
- 对预制体、场景等二进制文件的修改，需特别说明，避免多人协作时难以合并

### 12. 测试与调试友好
- 关键逻辑预留调试开关或日志，方便定位问题
- 复杂算法或状态机建议编写单元测试（如项目支持）

### 13. 严格遵循 Cocos 生命周期与事件
- 严格遵循组件生命周期顺序，避免在 onLoad 中访问未初始化的其他组件
- 事件监听（on、once）必须在 onDestroy 中移除，防止内存泄漏

### 14. 跨平台与分辨率适配
- 注意适配策略（固定高度/宽度、Canvas 适配），确保不同屏幕比例下 UI 显示正确

### 执行方式
每次协作时，自动遵循以上规则。在需求明确后，先给出计划摘要并等待确认；涉及文件操作时明确列出待操作文件；代码输出时用注释说明遵循的关键原则（如"使用对象池优化"）。若现有代码可复用，主动指出。
