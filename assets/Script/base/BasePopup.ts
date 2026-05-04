/**
 * BasePopup - 弹窗基类
 * 继承 BaseUI，增加弹窗生命周期方法
 * 供挂载到 popupLayer 的弹窗使用（如胜利弹窗、设置弹窗）
 * 
 * 生命周期：
 * - onShow(data?, closeCallback?)：弹窗打开时调用，自动创建蒙版、初始化界面和事件
 * - onHide()：弹窗关闭时调用，由 PopupManager 调用
 * - onDestroy()：弹窗销毁时调用，清理蒙版和事件监听
 * 
 * 弹窗特性：
 * - 自动创建半透明蒙版（点击可关闭）
 * - 支持多弹窗并行显示（通过 zIndex 控制层级）
 * - 支持关闭回调（closeCallback）
 * 
 * 使用方式：
 * 1. 继承 BasePopup 创建新弹窗
 * 2. 重写 initView() 初始化弹窗界面
 * 3. 重写 initEvent() 初始化弹窗事件
 * 4. 通过 PopupManager.show('弹窗名', data) 显示弹窗
 */

import BaseUI from './BaseUI';
import { GlobalBroadcast } from '../broadcast/GlobalBroadcast';

/**
 * 弹窗基类
 * 提供弹窗显示/隐藏/蒙版等生命周期管理
 */
export default class BasePopup extends BaseUI {
    /** 弹窗是否正在显示 */
    protected isShowing: boolean = false;
    /** 弹窗传递的数据 */
    protected data: any;
    /** 弹窗关闭时的回调函数 */
    protected closeCallback: (() => void) | null = null;
    /** 蒙版节点（半透明黑色背景） */
    protected maskNode: cc.Node | null = null;
    /** 是否启用蒙版 */
    protected maskEnabled: boolean = true;
    /** 点击蒙版是否关闭弹窗 */
    protected maskClickClose: boolean = false;
    /** 蒙版颜色（默认半透明黑色） */
    protected maskColor: cc.Color = new cc.Color(0, 0, 0, 150);

    constructor() {
        super();
    }

    onLoad(): void {
        this.initView();
    }

    start(): void {
        this.initEvent();
    }

    onEnable(): void {
        this.initEvent();
        GlobalBroadcast.register(this, 'popup');
    }

    /**
      * 弹窗禁用隐藏时调用
      * 清理所有事件监听、销毁蒙版节点
      */
    onDisable(): void {
        super.onDisable();
        this.EventEmitter.offAll(this);
        // GlobalBroadcast.unregister(this);
        this.isShowing = false;
        this.data = null;
        if (this.closeCallback) {
            this.closeCallback();
            this.closeCallback = null;
        }

        if (this.maskNode) {
            this.maskNode.destroy();
            this.maskNode = null;
        }
    }

    /**
     * 弹窗打开时调用
     * 自动创建蒙版、初始化界面和事件
     * @param data 传递的数据（可选）
     * @param closeCallback 关闭时的回调（可选）
     */
    onShow(data?: any, closeCallback?: () => void): void {
        this.data = data;
        this.isShowing = true;
        this.closeCallback = closeCallback || null;
        this.node.active = true;

        this.createMask();
    }

    /**
     * 关闭当前弹窗
     * 通过 PopupManager 关闭本弹窗
     */
    protected onClose(): void {
        this.PopupManager.close(this.node.name);
    }

    /**
     * 创建弹窗蒙版
     * 半透明黑色背景，点击可关闭弹窗
     */
    protected createMask(): void {
        if (!this.maskEnabled) return;

        // 创建蒙版节点
        this.maskNode = new cc.Node('PopupMask');
        this.maskNode.parent = this.node;
        this.maskNode.zIndex = 0;
        this.maskNode.active = true;

        // 创建半透明纹理
        const buffer = new Uint8Array([0, 0, 0, 150]);
        const texture = new cc.Texture2D();
        texture.initWithData(buffer, cc.Texture2D.PixelFormat.RGBA8888, 1, 1);

        const spriteFrame = new cc.SpriteFrame();
        spriteFrame.setTexture(texture);

        const sprite = this.maskNode.addComponent(cc.Sprite);
        sprite.spriteFrame = spriteFrame;
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;

        // 获取 Canvas 节点
        const canvas = cc.director.getScene()?.getChildByName('Canvas');

        // Canvas 包围盒 → 弹窗节点的本地坐标
        if (!canvas) return;
        const canvasRect = canvas.getBoundingBoxToWorld();
        const localCorners = [
            this.node.convertToNodeSpaceAR(cc.v2(canvasRect.xMin, canvasRect.yMin)),
            this.node.convertToNodeSpaceAR(cc.v2(canvasRect.xMax, canvasRect.yMin)),
            this.node.convertToNodeSpaceAR(cc.v2(canvasRect.xMin, canvasRect.yMax)),
            this.node.convertToNodeSpaceAR(cc.v2(canvasRect.xMax, canvasRect.yMax)),
        ];

        // 计算本地坐标下的包围盒
        const minX = Math.min(...localCorners.map(c => c.x));
        const minY = Math.min(...localCorners.map(c => c.y));
        const maxX = Math.max(...localCorners.map(c => c.x));
        const maxY = Math.max(...localCorners.map(c => c.y));

        // 设置蒙版覆盖整个 Canvas 区域
        this.maskNode.setContentSize(maxX - minX, maxY - minY);
        this.maskNode.setPosition((minX + maxX) / 2, (minY + maxY) / 2);
        this.maskNode.setAnchorPoint(0.5, 0.5);

        // 添加 Button 组件使蒙版可以响应点击事件
        const button = this.maskNode.addComponent(cc.Button);
        button.interactable = true;

        // 注册蒙版点击事件（使用捕获阶段，确保在事件冒泡之前接收）
        this.maskNode.on(cc.Node.EventType.TOUCH_START, this.onMaskClick, this, true);

        // 调整子节点顺序，蒙版在最后（渲染在下层，不遮挡弹窗内容）
        this.maskNode.setSiblingIndex(0);
    }

    /**
     * 蒙版点击处理
     * 点击蒙版时关闭弹窗
     */
    protected onMaskClick(): void {
        if (this.maskClickClose) {
            this.onClose();
        }
    }

    /**
     * 设置蒙版颜色
     * @param color 蒙版颜色
     */
    protected setMaskColor(color: cc.Color): void {
        this.maskColor = color;
        if (this.maskNode) {
            this.maskNode.color = color;
        }
    }

    /**
     * 设置蒙版是否启用
     * @param enabled 是否启用
     */
    protected setMaskEnabled(enabled: boolean): void {
        this.maskEnabled = enabled;
        if (this.maskNode) {
            this.maskNode.active = enabled;
        }
    }

    /**
     * 设置点击蒙版是否关闭弹窗
     * @param canClose 是否可以关闭
     */
    protected setMaskClickClose(canClose: boolean): void {
        this.maskClickClose = canClose;
    }

    /**
     * 获取弹窗数据
     * @returns 传递的数据
     */
    getData(): any {
        return this.data;
    }

    /**
     * 弹窗是否正在显示
     * @returns 是否显示中
     */
    isActive(): boolean {
        return this.isShowing;
    }

    /**
     * 设置关闭回调
     * 弹窗关闭时执行的回调函数
     * @param callback 回调函数
     */
    setCloseCallback(callback: () => void): void {
        this.closeCallback = callback;
    }

    /**
     * 界面初始化，子类重写实现具体逻辑
     * 调用父类 initView() 确保基类初始化
     */
    protected initView():void{
        super.initView();
    }

    /**
     * 事件初始化，子类重写实现具体逻辑
     * 调用父类 initEvent() 确保基类初始化
     */
    protected initEvent():void{
        super.initEvent();
    }
}