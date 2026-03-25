# 五子棋游戏项目记忆

## ⚠️ 重要警告（新对话必读）

**在进行任何操作前，必须先阅读 `开发规范与错误记录.md`**

主要禁忌：
- ❌ **绝对不能重命名已有文件**（会导致编辑器绑定丢失）
- ❌ **不能批量修改多个文件**
- ❌ **不能删除已有文件**
- ✅ 修改代码前必须先说明并等待确认

---

## 项目概览

- **项目类型**: Cocos Creator 2.4.3 游戏项目
- **游戏类型**: 五子棋 (Gobang/Five-in-a-Row)
- **开发语言**: JavaScript (ES5/ES6 混合)
- **平台**: Web-mobile
- **配置中心**: `GameConfig.js` - 统一管理所有游戏参数

## 核心脚本功能

| 脚本文件 | 功能描述 | 关键方法 |
|---|---|---|
| `GameConfig.js` | 中心化配置文件 | 所有游戏参数常量 |
| `Battle.js` | 游戏主逻辑，棋盘交互，胜负判断 | `touchBegan()`, `_iswin()`, `confirmPlaceChess()` |
| `Chess.js` | 棋子UI显示与动画 | `updateUI()`, `playPlaceAnimation()` |
| `AI.js` | 人机对战AI算法 (Minimax + Alpha-Beta剪枝) | `getBestMove()`, `minimax()` |
| `Login.js` | 登录/主菜单场景逻辑 | `onStart()`, `onStartAI()` |
| `WinPopupManager.js` | 胜利弹窗管理 | `showWinPopup()` |
| `GameInfoManager.js` | 游戏信息面板 (回合/时间/悔棋) | `incrementTurn()`, `startTimer()` |
| `SettingManager.js` | 设置持久化管理 | `setMusicVolume()`, `setAIDifficulty()` |
| `SettingScene.js` | 设置场景UI交互 | `onMusicVolumeChange()` |
| `AudioManager.js` | 全局音效管理器 | `play()`, `playMusic()` |
| `ReplayManager.js` | **游戏回放管理器** | `init()`, `start()`, `pause()`, `stepForward()` |
| `ReplayUI.js` | **回放控制UI面板** | `show()`, `hide()`, `updateProgress()` |

## 关键实现细节

### 游戏模式
- **PvP**: 人人对战
- **PvE**: 人机对战 (通过 `gameMode` 变量区分)

### 棋盘逻辑
- **坐标系**: 使用二维数组 `map[y][x]` 存储棋盘状态 (0=空, 1=黑, 2=白)
- **胜负判定**: `_iswin()` 检查四个方向 (水平、垂直、左斜、右斜) 是否连成5子
- **注意**: 代码中 `count >= 4` 表示连成5子 (因为不包含当前落子)

### AI 算法
- **核心**: Minimax 算法 + Alpha-Beta 剪枝
- **启发式**: 只搜索已有棋子周围 2 格范围 (`getValidMoves`)
- **防守优先**: 优先检测并阻断对手的四连 (`findOpponentFours`)
- **分步计算**: 使用 `setTimeout` 分批处理，避免阻塞主线程
- **难度差异**: 通过 `GameConfig.AI.DIFFICULTY_SETTINGS` 配置不同难度参数

### 回放系统
- **数据来源**: 复用 `moveHistory` 数组记录落子历史
- **播放控制**: 支持播放/暂停/前进/后退/跳转/速度调节
- **速度选项**: 慢速(2秒/步)、正常(1秒/步)、快速(0.5秒/步)、极快(0.25秒/步)
- **触发入口**: 胜利弹窗中的"查看回放"按钮
- **关键方法**: `startReplay()`, `stopReplay()`, `replayPlaceChess()`, `clearBoardForReplay()`
- **UI控制**: `ReplayUI.js` 提供完整的播放控制面板
- **配置指南**: 见 `回放功能配置指南.md`

### 配置中心化 (GameConfig.js)
- **棋盘配置**: `GameConfig.BOARD` - 棋盘尺寸、棋子大小
- **棋子配置**: `GameConfig.CHESS` - 玩家索引、对象池大小
- **AI配置**: `GameConfig.AI` - 难度级别、评分权重、搜索范围
- **音效配置**: `GameConfig.AUDIO` - 音效名称、背景音乐、默认音量
- **UI配置**: `GameConfig.UI` - 弹窗层级、透明度、动画时长
- **回放配置**: `GameConfig.REPLAY` - 播放速度、状态模式
- **存储键名**: `GameConfig.STORAGE_KEYS` - 本地存储键名统一管理
- **场景名称**: `GameConfig.SCENES` - 场景名称常量

### 性能优化
- **对象池**: `chessPool` 用于复用棋子节点，减少 GC 压力
- **动画复用**: 棋子动画对象只创建一次

### 音效资源
- **已生成**: `placeChess.wav`, `preview.wav`, `buttonClick.wav`, `menuClick.wav`, `win.wav`
- **背景音乐**: `bgm_menu.wav`, `bgm_battle.wav`
- **存放位置**: `assets/resources/Audio/`

### 回放控制图标
- **已生成**: `icon_play.png`, `icon_pause.png`, `icon_step_back.png`, `icon_step_forward.png`, `icon_exit.png`, `icon_speed.png`
- **存放位置**: `assets/Texture/`
- **配置指南**: 见 `回放功能配置指南.md`

### 配置指南
- **第一阶段配置**: 见 `第一阶段功能配置指南.md` (设置界面、信息面板)
- **悔棋功能配置**: 见 `悔棋功能配置指南.md`
- **功能扩展说明**: 见 `README_功能扩展说明.md`

## 编辑器绑定注意
- 大部分功能依赖 Cocos Creator 编辑器内的节点绑定
- 确保 `Battle.js` 中的 `winPopupNode`, `undoButton`, `gameInfoNode` 等属性已正确关联场景节点
- 回放功能需要在胜利弹窗中添加"查看回放"按钮并绑定到 `WinPopupManager.js` 的 `replayButton` 属性
- 回放控制面板需要绑定到 `Battle.js` 的 `replayUINode` 属性
- 回放UI配置详见 `回放功能配置指南.md`

## 已完成功能
- ✅ 音效系统完善
- ✅ 配置中心化 (GameConfig.js)
- ✅ 游戏回放系统
- ✅ AI难度差异化配置

## 待办/扩展方向 (可能)
- 完善 AI 难度差异化逻辑 (使用配置中的 defenseWeight 和 randomFactor)
- 添加战绩统计系统
- 优化回放UI控件面板
