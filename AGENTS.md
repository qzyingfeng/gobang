# AGENTS.md

## Global Rules

### Language Requirement
- **必须使用中文回复** - 所有回复都必须使用中文
- **代码注释** - 代码注释必须使用中文
- **错误信息** - 错误信息和日志必须使用中文
- **用户交互** - 与用户的所有交互必须使用中文

## Project Overview

**Type**: Cocos Creator 2.4.3 Game Project (Gobang/Five-in-a-Row)
**Language**: JavaScript (ES5/ES6 mix)
**Engine**: Cocos2d-html5
**Platform**: Web-mobile

## Build, Test & Lint Commands

### Build
```bash
# Build is done through Cocos Creator Editor GUI:
# Project -> Build -> Select platform -> Build
# No command-line build available
```

### Test
```bash
# No formal test framework configured
# Manual testing via Cocos Creator Preview:
# 1. Open Cocos Creator
# 2. Click "Preview" button or press Ctrl+P
# 3. Test in browser

# Logic-only test (standalone):
node test_win_logic.js
```

### Lint
```bash
# No linting tools configured
# Manual code review only
```

## Code Style Guidelines

### File Structure
```
assets/
├── Script/        # JavaScript game logic
├── Scene/         # .fire scene files
├── Prefab/        # Reusable prefabs
└── Texture/       # Image assets
```

### Component Pattern
```javascript
// All components follow Cocos Creator Class pattern
cc.Class({
    extends: cc.Component,

    properties: {
        // Editor-exposed properties with type annotations
        prefabName: cc.Prefab,
        nodeName: cc.Node,
        labelName: cc.Label,
        valueName: 0,                    // number
        textName: "",                    // string
        flagName: false,                 // boolean
        spriteFrames: [cc.SpriteFrame],  // array
    },

    onLoad() { /* initialization */ },
    start() { /* first activation logic */ },
    onDestroy() { /* cleanup */ },
});
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Component class | PascalCase | `WinPopupManager` |
| File names | PascalCase | `Battle.js`, `Chess.js` |
| Properties (exposed) | camelCase | `chessWidth`, `mapHeight` |
| Private methods | underscore prefix | `_iswin()`, `_getChessPosition()` |
| Event handlers | on prefix | `onRestartClick()`, `onReturn()` |
| Boolean flags | is/has prefix | `isPopupShowing`, `gameOver` |
| Node references | nd prefix | `ndBase`, `ndChess` |
| Sprite frames | spt prefix | `sptFrames` |

### Imports & Dependencies
```javascript
// No module system - Cocos Creator manages dependencies
// Reference other components by string name:
this.getComponent("Chess")
this.getComponent("WinPopupManager")

// Use cc namespace for engine APIs:
cc.instantiate(), cc.director.loadScene(), cc.v2()
```

### Event Handling
```javascript
// Register events in start() or onLoad()
this.node.on(cc.Node.EventType.TOUCH_START, this.touchBegan, this);

// Cleanup in onDestroy()
this.node.off(cc.Node.EventType.TOUCH_START, this.touchBegan, this);
```

### Coordinate System
```javascript
// Screen to node space conversion
let posScreen = evt.getLocation();
let posNode = this.node.convertToNodeSpaceAR(posScreen);

// Use cc.v2() for Vec2 creation
let position = cc.v2(x, y);
```

### Error Handling
```javascript
// Use cc.error() for errors, cc.warn() for warnings
if (invalidCondition) {
    cc.error("Error message: ", details);
    return;
}

// Validate array bounds before access
if (x < 0 || x >= this.mapWidth) break;
```

### Comments
```javascript
// Chinese comments are acceptable in this codebase
// Use JSDoc for public methods:

/**
 * 方法功能描述
 * @param {Type} paramName - 参数说明
 * @returns {Type} 返回值说明
 */
methodName(paramName) {
    // 单行注释解释逻辑
}
```

### Console Logging
```javascript
// Use cc.log() or console.log() for debugging
cc.log("Debug info:", value);
console.log("Game state:", this.playerIdx);
```

## Key Patterns

### State Management
```javascript
// Initialize state in onLoad()
onLoad() {
    this.playerIdx = 1;       // 1=black, 2=white
    this.gameOver = false;
    this.map = [];            // 2D array for board state
}
```

### Node Lifecycle
```javascript
// Always cleanup listeners
onDestroy() {
    this.node.off(cc.Node.EventType.TOUCH_START, this.handler, this);
}
```

### Scene Navigation
```javascript
// Use cc.director.loadScene()
cc.director.loadScene("Login");
cc.director.loadScene("Battle");
```

## Important Notes

- **No npm/package.json** - This is a pure Cocos Creator project
- **No automated testing** - Manual testing in editor preview
- **No linting** - Follow existing code style
- **Chinese comments** are used throughout the codebase
- **Game logic**: `count >= 4` means 5-in-a-row (count excludes current piece)
