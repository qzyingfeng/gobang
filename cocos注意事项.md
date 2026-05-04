# Cocos Creator 注意事项

记录项目中用到的废弃接口及其替代方案。

---

## 已废弃接口

### 1. setLocalZOrder

**废弃原因**：`setLocalZOrder` 方法已废弃

**替代方案**：使用 `zIndex` 属性

**注意事项**：
- `zIndex` 不能为负数
- 负数会导致显示异常

**错误写法**：
```typescript
node.setLocalZOrder(-1);  // ❌ 废弃
```

**正确写法**：
```typescript
node.zIndex = 0;  // ✅ 正确
node.zIndex = 100;  // ✅ 正确
```

---

### 2. cc.Widget.Edge

**废弃原因**：Cocos 2.4.x 中 `cc.Widget.Edge` 枚举不存在

**替代方案**：使用数字或直接设置 top/bottom/left/right 属性

**错误写法**：
```typescript
widget.alignFlags = cc.Widget.Edge.BOTH;  // ❌ 不存在
```

**正确写法**：
```typescript
// 方案1：直接设置边距
widget.top = 0;
widget.bottom = 0;
widget.left = 0;
widget.right = 0;

// 方案2：使用数字（45 = TOP | BOTTOM | LEFT | RIGHT）
widget.alignFlags = 45;
```

---

### 3. cc.Widget.isAlignOnce

**废弃原因**：`isAlignOnce` 属性已废弃

**替代方案**：使用 `alignMode` 属性

**错误写法**：
```typescript
widget.isAlignOnce = false;  // ❌ 废弃
widget.alignMode = cc.Widget.AlignMode.ONCE;
```

**正确写法**：
```typescript
widget.alignMode = cc.Widget.AlignMode.ONCE;  // ✅ 正确
```

---

### 4. cc.Widget.alignFlags

**废弃原因**：`alignFlags` 属性不存在

**替代方案**：使用数字（45 = TOP | BOTTOM | LEFT | RIGHT）

**错误写法**：
```typescript
widget.alignFlags = cc.Widget.Edge.BOTH;  // ❌ 不存在
```

**正确写法**：
```typescript
widget.top = 0;
widget.bottom = 0;
widget.left = 0;
widget.right = 0;
```

---

### 5. cc.loader

**废弃原因**：Cocos 2.4+ 推荐使用 `cc.assetManager`

**替代方案**：使用 `cc.assetManager` 或 `cc.resources`

**错误写法**：
```typescript
cc.loader.loadRes('path', cc.Prefab, callback);  // ❌ 废弃
```

**正确写法**：
```typescript
cc.resources.load('path', cc.Prefab, callback);  // ✅ 推荐
```

---

## 注意事项

### zIndex 限制
- zIndex 必须 >= 0
- 负数会导致节点不显示或显示异常

### 装饰器支持
- Cocos Creator 2.4.x 支持 `@ccclass` 装饰器
- 需要在项目设置中启用 "Enable Decorators"

### 模块系统
- 推荐使用 ES6 import/export
- 不支持 require/module.exports
- import 时不能加 .ts 后缀

### 生命周期函数调用原则
- **禁止手动调用** `onLoad`、`onEnable`、`onDestroy` 等生命周期函数
- 让 Cocos 引擎自动调用，否则会导致问题
- 例如：不要在 UIManager.close() 或 PopupManager.close() 中手动调用 script.onDestroy()

**错误写法**：
```typescript
// PopupManager.ts / UIManager.ts
close() {
    script.onDestroy();  // ❌ 禁止手动调用
    node.destroy();
}
```

**正确写法**：
```typescript
close() {
    node.destroy();  // ✅ Cocos 自动调用 onDestroy
}
```

---

## 持续更新

如有新的废弃接口发现，请在此文档中更新。