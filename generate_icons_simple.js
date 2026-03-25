/**
 * 回放控制图标生成脚本（使用 jimp）
 * 使用 jimp 库生成 PNG 图标
 * 
 * 运行方式：node generate_icons_simple.js
 */

const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

// 配置
const ICON_SIZE = 64;
const OUTPUT_DIR = path.join(__dirname, 'assets', 'Texture');

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 白色 (RGBA)
const WHITE = 0xFFFFFFFF;

/**
 * 创建空白透明图像
 */
function createImage() {
    return new Jimp({ width: ICON_SIZE, height: ICON_SIZE, color: 0x00000000 });
}

/**
 * 生成播放图标
 */
function generatePlay() {
    const image = createImage();
    // 简单的三角形 - 使用矩形近似
    for (let y = 12; y < 52; y++) {
        const progress = (y - 12) / 40;
        const startX = Math.floor(20 + progress * 15);
        const endX = Math.floor(20 + progress * 30);
        for (let x = startX; x < endX && x < ICON_SIZE; x++) {
            image.setPixelColor(WHITE, x, y);
        }
    }
    return image;
}

/**
 * 生成暂停图标
 */
function generatePause() {
    const image = createImage();
    // 两条竖线
    for (let y = 12; y < 52; y++) {
        for (let x = 18; x < 28; x++) {
            image.setPixelColor(WHITE, x, y);
        }
        for (let x = 36; x < 46; x++) {
            image.setPixelColor(WHITE, x, y);
        }
    }
    return image;
}

/**
 * 生成后退图标
 */
function generateStepBack() {
    const image = createImage();
    // 左边竖线
    for (let y = 12; y < 52; y++) {
        for (let x = 14; x < 20; x++) {
            image.setPixelColor(WHITE, x, y);
        }
    }
    // 三角形
    for (let y = 12; y < 52; y++) {
        const progress = (y - 12) / 40;
        const startX = Math.floor(24);
        const endX = Math.floor(24 + progress * 28);
        for (let x = startX; x < endX && x < ICON_SIZE; x++) {
            image.setPixelColor(WHITE, x, y);
        }
    }
    return image;
}

/**
 * 生成前进图标
 */
function generateStepForward() {
    const image = createImage();
    // 三角形
    for (let y = 12; y < 52; y++) {
        const progress = (y - 12) / 40;
        const startX = Math.floor(14 + (1 - progress) * 28);
        const endX = Math.floor(42);
        for (let x = startX; x < endX && x < ICON_SIZE; x++) {
            image.setPixelColor(WHITE, x, y);
        }
    }
    // 右边竖线
    for (let y = 12; y < 52; y++) {
        for (let x = 44; x < 50; x++) {
            image.setPixelColor(WHITE, x, y);
        }
    }
    return image;
}

/**
 * 生成退出图标 (X)
 */
function generateExit() {
    const image = createImage();
    const thickness = 4;
    
    // 从左上到右下的对角线
    for (let i = 0; i < 32; i++) {
        const x = 16 + i;
        const y = 16 + i;
        for (let t = -thickness; t <= thickness; t++) {
            const px = x + t;
            const py = y;
            if (px >= 0 && px < ICON_SIZE && py >= 0 && py < ICON_SIZE) {
                image.setPixelColor(WHITE, px, py);
            }
            const px2 = x;
            const py2 = y + t;
            if (px2 >= 0 && px2 < ICON_SIZE && py2 >= 0 && py2 < ICON_SIZE) {
                image.setPixelColor(WHITE, px2, py2);
            }
        }
    }
    
    // 从右上到左下的对角线
    for (let i = 0; i < 32; i++) {
        const x = 48 - i;
        const y = 16 + i;
        for (let t = -thickness; t <= thickness; t++) {
            const px = x + t;
            const py = y;
            if (px >= 0 && px < ICON_SIZE && py >= 0 && py < ICON_SIZE) {
                image.setPixelColor(WHITE, px, py);
            }
            const px2 = x;
            const py2 = y + t;
            if (px2 >= 0 && px2 < ICON_SIZE && py2 >= 0 && py2 < ICON_SIZE) {
                image.setPixelColor(WHITE, px2, py2);
            }
        }
    }
    
    return image;
}

/**
 * 生成速度图标（简化版）
 */
function generateSpeed() {
    const image = createImage();
    // 简化的闪电形状
    // 上半部分三角形
    for (let y = 8; y < 32; y++) {
        const progress = (y - 8) / 24;
        const startX = Math.floor(32 - progress * 12);
        const endX = Math.floor(32 + progress * 12);
        for (let x = startX; x < endX && x < ICON_SIZE; x++) {
            image.setPixelColor(WHITE, x, y);
        }
    }
    // 下半部分三角形
    for (let y = 32; y < 56; y++) {
        const progress = (y - 32) / 24;
        const startX = Math.floor(32 - (1 - progress) * 12);
        const endX = Math.floor(32 + (1 - progress) * 12);
        for (let x = startX; x < endX && x < ICON_SIZE; x++) {
            image.setPixelColor(WHITE, x, y);
        }
    }
    return image;
}

// 图标生成函数
const iconGenerators = {
    'icon_play': generatePlay,
    'icon_pause': generatePause,
    'icon_step_back': generateStepBack,
    'icon_step_forward': generateStepForward,
    'icon_exit': generateExit,
    'icon_speed': generateSpeed,
};

/**
 * 主函数
 */
async function main() {
    console.log('开始生成回放控制图标...\n');
    
    for (const [name, generator] of Object.entries(iconGenerators)) {
        try {
            const image = generator();
            const outputPath = path.join(OUTPUT_DIR, `${name}.png`);
            await image.write(outputPath);
            console.log(`✓ ${name}.png 已生成`);
        } catch (err) {
            console.error(`✗ ${name}.png 生成失败:`, err.message);
            console.error(err.stack);
        }
    }
    
    console.log(`\n图标已保存到: ${OUTPUT_DIR}`);
    console.log('\n请在 Cocos Creator 中刷新资源目录以加载新图标。');
}

// 运行
main().catch(console.error);
