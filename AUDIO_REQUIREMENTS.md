# 五子棋游戏音效需求文档

## 概述
本文档列出了五子棋游戏所需的所有音效文件，包括用途说明和使用场景。

## 音效列表

### 游戏核心音效

| 标识符 | 用途 | 建议文件名 | 触发场景 |
|--------|------|------------|----------|
| `placeChess` | 落子音效 | `placeChess.mp3` | 玩家或AI放置棋子时播放 |
| `win` | 胜利音效 | `win.mp3` | 一方获胜，显示胜利弹窗时播放 |
| `preview` | 落子预览音效 | `preview.mp3` | 鼠标悬停在可落子位置时播放 |
| `buttonClick` | 按钮点击音效 | `buttonClick.mp3` | 胜利弹窗中的按钮点击时播放 |

### 登录界面音效

| 标识符 | 用途 | 建议文件名 | 触发场景 |
|--------|------|------------|----------|
| `menuClick` | 菜单按钮点击音效 | `menuClick.mp3` | 登录界面的按钮点击时播放 |

**登录界面按钮：**
1. **人人对战** (`onStart`) - 开始玩家对战
2. **AI对战** (`onStartAI`) - 开始人机对战  
3. **退出游戏** (`onExit`) - 退出游戏

## 音频文件要求

**重要提示**：音频文件必须放在 `assets/resources/Audio/` 目录下，因为Cocos Creator 2.4.3使用 `cc.loader.loadRes` 动态加载资源，该方法只能加载resources目录下的文件。

### 文件格式
- **推荐格式**: MP3
- **备选格式**: WAV, OGG
- **采样率**: 44.1kHz 或 48kHz
- **比特率**: 128kbps 或更高

### 文件位置
所有音效文件应放置在 `assets/resources/Audio/` 目录下。

### 文件命名规范
- 使用小写字母和数字
- 单词间用下划线分隔（如 `place_chess.mp3`）
- 或使用驼峰命名（如 `placeChess.mp3`）

## 使用方法

### 在代码中播放音效
```javascript
// 播放落子音效
AudioManager.play('placeChess');

// 播放胜利音效
AudioManager.play('win');

// 播放按钮点击音效
AudioManager.play('buttonClick');

// 播放菜单按钮点击音效
AudioManager.play('menuClick');
```

### 预加载音效（可选）
```javascript
// 预加载指定音效
AudioManager.init(['placeChess', 'win', 'buttonClick', 'menuClick'], function() {
    console.log('音效加载完成');
});

// 预加载所有音效
AudioManager.preloadAll(function() {
    console.log('所有音效加载完成');
});
```

## 音效资源建议

### 免费音效资源网站
1. [Freesound](https://freesound.org/) - 社区分享的音效库
2. [Zapsplat](https://www.zapsplat.com/) - 免费音效和音乐
3. [Mixkit](https://mixkit.co/free-sound-effects/) - 免费音效素材
4. [OpenGameArt](https://opengameart.org/) - 游戏开发资源

### 搜索关键词建议
- 落子音效: "chess piece place", "stone drop", "click"
- 胜利音效: "victory", "win", "success", "achievement"
- 按钮点击: "button click", "ui click", "tap"
- 预览音效: "hover", "preview", "selection"

## 音量建议

| 音效类型 | 建议音量 | 说明 |
|----------|----------|------|
| 落子音效 | 70-80% | 清晰但不突兀 |
| 胜利音效 | 85-95% | 突出庆祝效果 |
| 按钮点击 | 60-70% | 轻微反馈 |
| 预览音效 | 50-60% | 轻柔提示 |

## 扩展音效建议（可选）

### 背景音乐
- 轻松愉快的对弈背景音乐
- 紧张刺激的AI对战音乐

### 其他音效
- 错误提示音：无效落子位置
- 游戏开始音效：对局开始
- 平局音效：棋盘下满无人获胜

## 更新日志

### v1.0 (2026-03-22)
- 初始版本
- 定义基础音效需求：落子、胜利、预览、按钮点击
- 添加登录界面菜单音效需求