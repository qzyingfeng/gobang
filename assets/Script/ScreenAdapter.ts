/**
 * 屏幕适配组件
 * 使用 GridCell 图片填充超出设计分辨率（960）的上下黑边
 * 挂载到 Canvas 节点上
 */

const { ccclass } = cc._decorator;

@ccclass
export default class ScreenAdapter extends cc.Component {
    /** 设计高度 */
    private designHeight: number = 960;
    /** 格子大小 */
    private cellSize: number = 50;
    /** 格子精灵帧 */
    private gridSpriteFrame: cc.SpriteFrame | null = null;
    /** 格子容器 */
    private gridContainer: cc.Node | null = null;

    onLoad(): void {
        cc.resources.load('Texture/GridCell', cc.SpriteFrame, (err, spriteFrame: cc.SpriteFrame) => {
            if (err) {
                cc.error('ScreenAdapter: 加载贴图失败', err);
                return;
            }
            this.gridSpriteFrame = spriteFrame;
            this.createGrid();
        });
    }

    /** 创建黑边覆盖格子 */
    private createGrid(): void {
        if (!this.gridSpriteFrame) return;

        const canvas = this.node;
        const sw = canvas.width;
        const sh = canvas.height;
        const excess = sh - this.designHeight;

        if (excess <= 0) return;

        // 创建容器
        this.gridContainer = new cc.Node('GridContainer');
        this.gridContainer.parent = canvas;
        this.gridContainer.setSiblingIndex(0);
        this.gridContainer.setPosition(0, 0);

        const halfExcess = excess / 2;
        const rows = Math.ceil(halfExcess / this.cellSize);
        const cols = Math.ceil(sw / this.cellSize);

        // 顶部黑边
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = -sw / 2 + c * this.cellSize + this.cellSize / 2;
                const y = this.designHeight / 2 + r * this.cellSize + this.cellSize / 2;
                this.createCell(x, y);
            }
        }

        // 底部黑边
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = -sw / 2 + c * this.cellSize + this.cellSize / 2;
                const y = -this.designHeight / 2 - r * this.cellSize - this.cellSize / 2;
                this.createCell(x, y);
            }
        }
    }

    /** 创建单个格子 */
    private createCell(x: number, y: number): void {
        const node = new cc.Node('GridCell');
        node.parent = this.gridContainer;
        node.setPosition(x, y);
        node.setContentSize(this.cellSize, this.cellSize);

        const sprite = node.addComponent(cc.Sprite);
        sprite.spriteFrame = this.gridSpriteFrame;
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
    }
}
