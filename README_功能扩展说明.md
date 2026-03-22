# 五子棋游戏功能扩展说明

## 新增功能

### 1. 落子确认功能
- 点击棋盘时显示预览棋子（半透明）
- 显示"确认"和"取消"按钮
- 点击"确认"后正式落子
- 点击"取消"后取消落子操作

### 2. 胜利弹窗功能
- 当一方获胜时显示弹窗
- 弹窗显示获胜方（黑子或白子获胜）
- 提供"重新开始"和"返回菜单"按钮

## 文件结构

### 新增文件
- `assets/Script/WinPopup.js` - 胜利弹窗脚本
- `assets/Prefab/WinPopup.prefab` - 胜利弹窗预制体

### 修改文件
- `assets/Script/Battle.js` - 战斗场景脚本，添加落子确认和胜利弹窗功能
- `assets/Script/Chess.js` - 棋子脚本，添加详细注释

## Cocos Creator编辑器设置步骤

### 1. 设置Battle场景
1. 打开Battle场景
2. 在Canvas节点下添加以下UI元素：
   - 确认按钮（Button）
   - 取消按钮（Button）
   - 预览棋子节点（Node，挂载Chess组件）
3. 为Battle节点添加Battle脚本组件
4. 在Battle脚本组件属性面板中设置：
   - `confirmButton`: 拖拽确认按钮节点
   - `cancelButton`: 拖拽取消按钮节点
   - `previewChess`: 拖拽预览棋子节点
   - `winPopupPrefab`: 拖拽WinPopup预制体

### 2. 设置WinPopup预制体
1. 在Prefab文件夹中找到WinPopup.prefab
2. 双击打开预制体编辑器
3. 确保以下节点存在：
   - `WinPopup`根节点（需要添加WinPopup脚本）
   - `Background`背景节点
   - `WinLabel`胜利文本节点（挂载Label组件）
   - `RestartButton`重新开始按钮（挂载Button组件）
   - `MenuButton`返回菜单按钮（挂载Button组件）
4. **重要：** 在WinPopup根节点上添加WinPopup脚本组件
5. 在WinPopup脚本组件属性面板中设置：
   - `winLabel`: 拖拽WinLabel节点
   - `restartButton`: 拖拽RestartButton节点
   - `menuButton`: 拖拽MenuButton节点

### 3. 设置棋子预制体
1. 确保Chess.prefab有正确的棋子精灵帧
2. 黑子精灵帧放在sptFrames数组索引0
3. 白子精灵帧放在sptFrames数组索引1

## 代码结构说明

### Battle.js 主要功能
1. **onLoad()**: 初始化游戏状态、棋盘数据、胜利弹窗
2. **start()**: 设置事件监听、初始化UI状态
3. **touchBegan()**: 处理触摸事件，显示预览棋子
4. **onConfirmClick()**: 确认落子，检查胜利条件
5. **onCancelClick()**: 取消落子操作
6. **showWinPopup()**: 显示胜利弹窗
7. **_iswin()**: 检查是否胜利（四个方向）

### WinPopup.js 主要功能
1. **showWinPopup()**: 显示胜利弹窗，设置获胜方文本
2. **hideWinPopup()**: 隐藏胜利弹窗
3. **onRestartClick()**: 重新开始游戏
4. **onMenuClick()**: 返回主菜单

### Chess.js 主要功能
1. **updateUI()**: 根据玩家索引更新棋子外观
2. **setOpacity()**: 设置棋子透明度（用于预览）
3. **getChessType()**: 获取当前棋子类型

## 游戏流程

1. **开始游戏**: 玩家点击棋盘任意位置
2. **预览落子**: 显示半透明预览棋子和确认/取消按钮
3. **确认落子**: 点击"确认"按钮，正式落子
4. **取消落子**: 点击"取消"按钮，取消落子操作
5. **检查胜利**: 落子后检查是否五子连珠
6. **显示弹窗**: 胜利时显示弹窗，提供重新开始或返回菜单选项

## 注意事项

1. 确保所有节点和组件正确关联
2. 检查预制体引用是否正确
3. 测试触摸事件是否正常响应
4. 验证胜利判断逻辑是否正确
5. 确保弹窗显示和隐藏功能正常