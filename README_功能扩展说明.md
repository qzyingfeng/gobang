# 五子棋游戏功能扩展说明

## 项目概述

本项目是基于 Cocos Creator 2.4.3 开发的五子棋游戏，包含完整的游戏逻辑、AI对战、回放系统、悔棋功能等。

---

## 游戏模式

| 模式 | 说明 |
|------|------|
| **PvP（人人）** | 两位玩家轮流落子 |
| **PvE（人机）** | 玩家对战AI，支持三个难度级别 |

---

## 核心功能模块

### 1. 游戏主逻辑（Battle.js）

**文件路径**: `assets/Script/Battle.js`

**主要功能**:
- 棋盘初始化与状态管理
- 触摸落子处理
- 胜负判断（四个方向检查五子连珠）
- 落子预览（半透明预览棋子）
- AI对战集成
- 悔棋功能
- 回放功能集成
- 对象池优化（棋子复用）

**关键方法**:
| 方法 | 功能 |
|------|------|
| `touchBegan()` | 触摸事件处理，显示预览棋子 |
| `confirmPlaceChess()` | 确认落子 |
| `_iswin()` | 四方向胜负判断 |
| `triggerAIMove()` | 触发AI落子 |
| `undoLastMove()` | 悔棋操作 |
| `startReplay()` | 开始回放 |

---

### 2. AI对战系统（AI.js）

**文件路径**: `assets/Script/AI.js`

**算法特性**:
- **Minimax算法 + Alpha-Beta剪枝**：高效搜索最优落子
- **启发式搜索**：只搜索已有棋子周围2格范围，减少无效计算
- **威胁检测**：优先识别对手四连并防守
- **异步执行**：分批处理避免阻塞主线程

**难度配置**:
| 难度 | 搜索深度 | 最大思考时间 |
|------|---------|------------|
| 简单 | 2层 | 10秒 |
| 中等 | 3层 | 15秒 |
| 困难 | 4层 | 20秒 |

**棋型评分**:
| 棋型 | 分数 |
|------|------|
| 连五 | 100,000 |
| 活四 | 10,000 |
| 冲四 | 1,000 |
| 活三 | 100 |
| 眠三 | 10 |
| 活二 | 1 |

---

### 3. 回放系统

#### ReplayManager.js
**文件路径**: `assets/Script/ReplayManager.js`

功能：
- 回放状态管理（播放/暂停/停止）
- 步进控制（前进/后退）
- 速度调节（0.5x / 1x / 2x / 4x）
- 进度回调通知

#### ReplayUI.js
**文件路径**: `assets/Script/ReplayUI.js`

功能：
- 回放控制面板UI
- 播放/暂停切换
- 前进/后退一步
- 速度循环切换
- 进度显示（当前步/总步数）
- 退出回放

**回放速度配置**:
| 显示 | 实际速度 |
|------|----------|
| 0.5x | 2000ms/步 |
| 1x | 1000ms/步 |
| 2x | 500ms/步 |
| 4x | 250ms/步 |

---

### 4. 悔棋功能

**文件路径**: `assets/Script/Battle.js`（集成）

**功能说明**:
- **PvP模式**：撤销最后一步落子
- **PvE模式**：撤销两步（玩家+AI各一步）
- 限制条件：
  - 游戏结束后无法悔棋
  - AI思考中无法悔棋
  - 无落子历史时无法悔棋

**关键方法**:
- `recordMove()` - 记录落子历史
- `undoLastMove()` - 执行悔棋
- `_undoSingleMove()` - 撤销单步

---

### 5. 音效系统（AudioManager.js）

**文件路径**: `assets/Script/AudioManager.js`

**功能**:
- 音效播放（落子、预览、按钮、胜利）
- 背景音乐播放（主菜单、战斗场景）
- 音量控制（背景音乐、音效分离）
- 音频预加载与缓存
- 容错处理（文件不存在时静默跳过）

**音效接口**:
```javascript
AudioManager.play('placeChess');        // 落子音效
AudioManager.play('preview');            // 预览音效
AudioManager.play('buttonClick');        // 按钮点击
AudioManager.play('win');               // 胜利音效
AudioManager.playMusic('bgm_menu', true); // 背景音乐
```

---

### 6. 设置系统

#### SettingManager.js
**文件路径**: `assets/Script/SettingManager.js`

**功能**:
- 音量设置（背景音乐、音效）
- AI难度选择
- 设置持久化（localStorage）
- 默认值重置

#### SettingScene.js
**文件路径**: `assets/Script/SettingScene.js`

**配置项**:
| 配置项 | 类型 | 范围 | 默认值 |
|--------|------|------|--------|
| 背景音乐音量 | Slider | 0-100% | 50% |
| 音效音量 | Slider | 0-100% | 100% |
| AI难度 | Button | 简单/中等/困难 | 中等 |

---

### 7. 游戏信息面板（GameInfoManager.js）

**文件路径**: `assets/Script/GameInfoManager.js`

**显示内容**:
- 回合数
- 游戏用时（实时计时）
- 悔棋次数

---

### 8. 胜利弹窗（WinPopupManager.js）

**文件路径**: `assets/Script/WinPopupManager.js`

**功能**:
- 显示获胜方（黑子/白子）
- 重新开始按钮
- 返回菜单按钮
- 查看回放按钮

---

### 9. 棋子组件（Chess.js）

**文件路径**: `assets/Script/Chess.js`

**功能**:
- 棋子外观更新（黑子/白子切换）
- 落子动画（缩放弹性效果）
- 最后落子标记（红色圆圈）
- 透明度控制（预览时半透明）
- 状态重置（对象池复用）

**性能优化**:
- 动画模板复用
- 标记节点只创建一次
- Graphics绘制只执行一次

---

### 10. 中心化配置（001_GameConfig.js）

**文件路径**: `assets/Script/001_GameConfig.js`

**配置分类**:
| 配置项 | 说明 |
|--------|------|
| `BOARD` | 棋盘尺寸、棋子大小 |
| `CHESS` | 棋子状态（黑/白/空） |
| `AI` | 难度参数、棋型评分 |
| `AUDIO` | 音效名称、音量默认值 |
| `UI` | 层级、透明度、动画时长 |
| `WIN` | 胜利条件、检查方向 |
| `STORAGE_KEYS` | 持久化键名 |
| `REPLAY` | 回放速度、状态定义 |

---

## 场景结构

### Login场景（Login.fire）
- 主菜单界面
- 人人对战按钮
- AI对战按钮
- 设置按钮
- 退出按钮

### Battle场景（Battle.fire）
- 棋盘节点（触摸区域）
- 棋子预制体挂载点
- 预览棋子
- 游戏信息面板
- 胜利弹窗
- 回放控制面板
- 悔棋按钮

### Setting场景（Setting.fire）
- 设置面板
- 音乐音量滑动条
- 音效音量滑动条
- AI难度选择按钮
- 返回按钮
- 重置按钮

---

## 文件结构

```
assets/
├── Script/
│   ├── 001_GameConfig.js      # 中心化配置
│   ├── AI.js                  # AI算法
│   ├── AudioManager.js        # 音效管理
│   ├── Battle.js              # 游戏主逻辑
│   ├── Chess.js               # 棋子组件
│   ├── GameInfoManager.js     # 信息面板
│   ├── Login.js               # 登录场景
│   ├── ReplayManager.js       # 回放管理器
│   ├── ReplayUI.js            # 回放UI
│   ├── SettingManager.js      # 设置管理
│   ├── SettingScene.js        # 设置场景
│   └── WinPopupManager.js     # 胜利弹窗
├── Scene/
│   ├── Battle.fire            # 战斗场景
│   ├── Login.fire             # 登录场景
│   └── Setting.fire           # 设置场景
├── Prefab/
│   └── Chess.prefab           # 棋子预制体
└── Texture/
    └── *.png                  # UI图片资源
```

---

## Cocos Creator 编辑器配置

### 落子预览功能
1. 创建预览棋子节点，挂载Chess组件
2. 绑定到Battle脚本的`previewChess`属性

### 悔棋功能
1. 创建悔棋按钮
2. 绑定到Battle脚本的`undoButton`属性
3. 配置按钮点击事件调用`onUndoClick`

### 回放功能
1. 创建回放控制面板节点
2. 挂载ReplayUI组件
3. 绑定按钮和标签到对应属性
4. 绑定到Battle脚本的`replayUINode`属性

### 音效资源
音效文件需放在 `assets/resources/Audio/` 目录：
- `placeChess.mp3/wav` - 落子音效
- `preview.mp3/wav` - 预览音效
- `buttonClick.mp3/wav` - 按钮音效
- `win.mp3/wav` - 胜利音效
- `menuClick.mp3/wav` - 菜单点击
- `bgm_menu.mp3/wav` - 主菜单背景音乐
- `bgm_battle.mp3/wav` - 战斗背景音乐

---

## 性能优化

1. **对象池复用**：棋子节点预创建，回收复用，减少GC压力
2. **异步AI计算**：分批处理落子评分，避免主线程阻塞
3. **动画模板复用**：Chess组件中动画对象只创建一次
4. **标记节点复用**：最后落子标记节点只创建一次，通过active切换

---

## 游戏流程

1. **主菜单** → 选择模式（PvP/PvE）
2. **战斗场景** → 落子/预览/悔棋
3. **胜利弹窗** → 重新开始/返回菜单/查看回放
4. **回放控制** → 播放/暂停/步进/速度调节

---

## 更新日志

**2026-03-24**
- 完善README功能扩展说明文档
- 梳理项目架构和模块关系

**2026-03-23**
- 完成回放功能代码实现
- 完成悔棋功能代码实现
- 添加游戏信息面板
- 添加设置系统

**2026-03-22**
- 完成AI对战系统
- 添加音效系统
- 添加落子预览功能
- 添加胜利弹窗
