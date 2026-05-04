/**
 * BaseUI - 通用 UI 基类
 * 继承 cc.Component，提供 11 种管理器能力
 * 
 * 子类通过 this.管理器名 直接使用，无需 import 或实例化
 * 
 * 管理器清单：
 * - 界面管理（UIManager）：show/hide/close
 * - 弹窗管理（PopupManager）：open/close
 * - 提示管理（TipManager）：showTip
 * - 音频管理（AudioManager）：playMusic/playEffect
 * - 设置管理（SettingManager）：get/set
 * - 回放管理（ReplayManager）：start/stop/seek
 * - 时间管理（TimeManager）：formatTimestamp/schedule
 * - 资源管理（ResourceManager）：load/register/release
 * - 事件派发（EventEmitter）：on/off/emit
 * - AI（AI）：getBestMove
 * - 工具函数（utils）：通用方法
 * 
 * 使用方式：
 * 1. 继承 BaseUI 创建新界面
 * 2. 重写 initView() 初始化界面
 * 3. 重写 initEvent() 初始化事件
 */

import UIManager from '../manager/UIManager';
import PopupManager from '../manager/PopupManager';
import TipManager from '../manager/TipManager';
import AudioManager from '../manager/AudioManager';
import SettingManager from '../manager/SettingManager';
import ReplayManager from '../manager/ReplayManager';
import TimeManager from '../manager/TimeManager';
import EventEmitter from '../manager/EventEmitter';
import ResourceManager from '../manager/ResourceManager';
import AI from '../AI';
import { GlobalBroadcast } from '../broadcast/GlobalBroadcast';
import utils from '../utils/common';

const { ccclass, property } = cc._decorator;

@ccclass
export default class BaseUI extends cc.Component {
    /** 界面管理器，负责显示/隐藏/切换界面 */
    protected UIManager = UIManager.getInstance();

    /** 弹窗管理器，负责显示/隐藏弹窗 */
    protected PopupManager = PopupManager.getInstance();

    /** 提示管理器，负责显示 Toast 提示（暂未启用） */
    // protected TipManager = TipManager.getInstance();

    /** 音频管理器，负责播放背景音乐和音效 */
    protected AudioManager = AudioManager.getInstance();

    /** 设置管理器，负责本地存储读写 */
    protected SettingManager = SettingManager.getInstance();

    /** 回放管理器，负责游戏回放控制 */
    protected ReplayManager = ReplayManager.getInstance();

    /** 时间管理器，负责定时任务 */
    protected TimeManager = TimeManager.getInstance();

    /** 事件派发器，负责组件间通信 */
    protected EventEmitter = EventEmitter.getInstance();

    /** 资源管理器，负责动态资源加载和释放 */
    protected ResourceManager = ResourceManager.getInstance();

    /** AI 管理器，负责 AI 落子计算 */
    protected AI = AI;

    /** 通用工具函数 */
    protected utils = utils;

    constructor() {
        super();
    }



    onDisable() {
        this.EventEmitter.offAll(this);
        GlobalBroadcast.unregister(this);
    }

    /**
     * 获取节点上的组件
     * @param node 节点
     * @param componentName 组件名称（脚本名）
     * @returns 组件实例或 null
     */
    protected getComp<T extends cc.Component>(node: cc.Node, componentName: string): T | null {
        return this.node.getComponent(componentName) as T;
    }

    /**
     * 查找子节点
     * @param node 父节点
     * @param name 子节点名称
     * @returns 子节点或 null
     */
    protected findChild(node: cc.Node, name: string): cc.Node | null {
        return node.getChildByName(name);
    }

    /**
     * 安全调用回调函数，避免空指针报错
     * @param callback 回调函数
     * @param args 回调参数
     */
    protected safeCall<T>(callback: ((...args: T[]) => void) | undefined, ...args: T[]): void {
        if (typeof callback === 'function') {
            callback(...args);
        }
    }

    /**
     * 广播给所有活跃界面和弹窗
     * @param methodName 方法名（需用 @Broadcast 标记）
     * @param payload 传递的数据
     */
    protected broadcastAll(methodName: string, payload?: any): void {
        GlobalBroadcast.broadcastAll(methodName, payload, this);
    }

    /**
     * 仅广播给所有活跃页面
     * @param methodName 方法名（需用 @Broadcast 标记）
     * @param payload 传递的数据
     */
    protected broadcastPages(methodName: string, payload?: any): void {
        GlobalBroadcast.broadcastPages(methodName, payload, this);
    }

    /**
     * 仅广播给所有活跃弹窗
     * @param methodName 方法名（需用 @Broadcast 标记）
     * @param payload 传递的数据
     */
    protected broadcastPopups(methodName: string, payload?: any): void {
        GlobalBroadcast.broadcastPopups(methodName, payload, this);
    }

    /**
     * 界面初始化，子类重写实现具体逻辑
     * 在 onShow() 中自动调用
     */
    protected initView(): void {

    }

    /**
     * 事件初始化，子类重写实现具体逻辑
     * 在 onShow() 中自动调用
     */
    protected initEvent(): void {

    }
}