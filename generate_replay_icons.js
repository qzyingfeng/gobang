/**
 * 回放控制图标生成脚本
 * 使用 canvas 生成播放/暂停/前进/后退等图标
 * 运行方式：node generate_replay_icons.js
 */

const fs = require('fs');
const path = require('path');

// 图标配置
const ICON_SIZE = 64;
const ICON_COLOR = '#FFFFFF';
const BG_COLOR = 'rgba(0, 0, 0, 0)';
const OUTPUT_DIR = path.join(__dirname, 'assets', 'Texture');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * 创建简单的SVG图标并转换为PNG
 * 由于没有canvas库，我们使用简单的SVG方案
 * 实际项目中可以使用 canvas 或 sharp 库生成真正的PNG
 */

// 播放图标 (三角形)
const playIcon = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" xmlns="http://www.w3.org/2000/svg">
    <polygon points="20,12 20,52 52,32" fill="${ICON_COLOR}"/>
</svg>`;

// 暂停图标 (两条竖线)
const pauseIcon = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="12" width="10" height="40" fill="${ICON_COLOR}"/>
    <rect x="36" y="12" width="10" height="40" fill="${ICON_COLOR}"/>
</svg>`;

// 后退图标 (左三角 + 竖线)
const stepBackIcon = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="12" width="6" height="40" fill="${ICON_COLOR}"/>
    <polygon points="24,12 24,52 50,32" fill="${ICON_COLOR}"/>
</svg>`;

// 前进图标 (右三角 + 竖线)
const stepForwardIcon = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" xmlns="http://www.w3.org/2000/svg">
    <polygon points="14,12 14,52 40,32" fill="${ICON_COLOR}"/>
    <rect x="44" y="12" width="6" height="40" fill="${ICON_COLOR}"/>
</svg>`;

// 退出图标 (X)
const exitIcon = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" xmlns="http://www.w3.org/2000/svg">
    <line x1="16" y1="16" x2="48" y2="48" stroke="${ICON_COLOR}" stroke-width="6"/>
    <line x1="48" y1="16" x2="16" y2="48" stroke="${ICON_COLOR}" stroke-width="6"/>
</svg>`;

// 速度图标 (闪电)
const speedIcon = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" xmlns="http://www.w3.org/2000/svg">
    <polygon points="32,8 20,32 28,32 24,56 44,28 34,28 40,8" fill="${ICON_COLOR}"/>
</svg>`;

// 保存SVG文件（可作为备用）
const icons = {
    'icon_play': playIcon,
    'icon_pause': pauseIcon,
    'icon_step_back': stepBackIcon,
    'icon_step_forward': stepForwardIcon,
    'icon_exit': exitIcon,
    'icon_speed': speedIcon,
};

// 生成配置说明文件
const readmeContent = `# 回放控制图标说明

## 需要生成的图标

由于没有图形库，本脚本生成了SVG格式的图标定义。

### 图标列表

| 文件名 | 用途 | 描述 |
|--------|------|------|
| icon_play.svg | 播放按钮 | 白色三角形 |
| icon_pause.svg | 暂停按钮 | 两条白色竖线 |
| icon_step_back.svg | 后退按钮 | 左三角 + 竖线 |
| icon_step_forward.svg | 前进按钮 | 右三角 + 竖线 |
| icon_exit.svg | 退出按钮 | 白色X |
| icon_speed.svg | 速度按钮 | 闪电图标 |

## 生成PNG方法

### 方法1：在线转换
1. 打开对应的SVG文件
2. 复制内容到在线SVG转PNG工具
3. 导出为64x64像素的PNG
4. 保存到 assets/Texture/ 目录

### 方法2：使用设计软件
1. 用Figma/Sketch/AI打开SVG
2. 导出为PNG格式
3. 保存到 assets/Texture/ 目录

### 方法3：使用命令行工具
\`\`\`bash
# 使用 imagemagick
convert icon_play.svg icon_play.png

# 使用 inkscape
inkscape icon_play.svg --export-png=icon_play.png
\`\`\`

## 替代方案

也可以直接使用现有按钮背景 + 文字：
- 使用 Btn.png 作为按钮背景
- 在按钮上添加文字标签（播放/暂停/后退/前进）
`;

// 写入README
fs.writeFileSync(path.join(__dirname, 'REPLAY_ICONS_README.md'), readmeContent);

// 写入SVG文件
Object.keys(icons).forEach(name => {
    const svgPath = path.join(__dirname, `${name}.svg`);
    fs.writeFileSync(svgPath, icons[name]);
    console.log(`生成: ${svgPath}`);
});

console.log('\n图标SVG文件已生成');
console.log('请查看 REPLAY_ICONS_README.md 了解如何转换为PNG');
console.log(`PNG文件需要保存到: ${OUTPUT_DIR}`);
