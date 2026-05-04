/**
 * BasePage - 页面基类
 * 继承 BaseUI，增加页面生命周期方法
 * 供挂载到 viewLayer 的界面使用（如登录界面、对战界面）
 * 
 * 生命周期：
 * - onShow(data?)：页面显示时调用，初始化界面和事件
 * - onHide()：页面隐藏时调用
 * - onDestroy()：页面销毁时调用
 * - onNavigate(panelName, data?)：跳转到其他页面
 * 
 * 使用方式：
 * 1. 继承 BasePage 创建新页面
 * 2. 重写 initView() 初始化界面（添加节点、设置属性）
 * 3. 重写 initEvent() 初始化事件（注册按钮点击、触摸事件）
 * 4. 通过 UIManager.show('页面名') 显示页面
 */

import BaseUI from './BaseUI';
import { GlobalBroadcast } from '../broadcast/GlobalBroadcast';

/**
 * 页面基类
 * 提供页面显示/隐藏/跳转等生命周期管理
 */
export default class BasePage extends BaseUI {
    /** 页面是否正在显示 */
    protected isShowing: boolean = false;
    /** 页面传递的数据 */
    protected data: any;

    constructor(node: cc.Node) {
        super();
        this.node = node;
    }

    onLoad(): void {
        this.initView();
    }

    start(): void {
        this.initEvent();
    }

    onEnable(): void {
        this.initEvent();
        GlobalBroadcast.register(this, 'page');
    }

    onDisable(): void {
        this.isShowing = false;
        this.data = null;
        super.onDisable();
        GlobalBroadcast.unregister(this);
    }

    /**
     * 页面显示时调用
     * @param data 传递的数据（可选）
     */
    onShow(data?: any): void {
        if(this.data){
            this.data = data;
        }
        this.isShowing = true;
        this.node.active = true;
    }

    /**
     * 关闭当前页面
     * 通过 UIManager 关闭本页面
     */
    protected onClose(): void {
        this.UIManager.close();
    }

    /**
     * 页面跳转（打开另一个页面）
     * @param panelName 面板名称（对应配置中的 key）
     * @param data 传递的数据（可选）
     */
    onNavigate(panelName: string, data?: any): void {
        this.UIManager.show(panelName, data);
    }

    /**
     * 获取页面数据
     * @returns 传递的数据
     */
    getData(): any {
        return this.data;
    }

    /**
     * 页面是否正在显示
     * @returns 是否显示中
     */
    isActive(): boolean {
        return this.isShowing;
    }

    /**
     * 界面初始化，子类重写实现具体逻辑
     * 调用父类 initView() 确保基类初始化
     */
    protected initView(): void {
        // 子类重写实现具体逻辑
        super.initView();
    }

    /**
     * 事件初始化，子类重写实现具体逻辑
     * 调用父类 initEvent() 确保基类初始化
     */
    protected initEvent(): void {
        // 子类重写实现具体逻辑
        super.initEvent();
    }
}