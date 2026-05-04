/**
 * Main - 主场景入口脚本
 * 挂载在 Canvas 节点上
 * 继承 BaseUI，自动获取 UIManager/PopupManager/TipManager
 * 
 * 功能说明：
 * - 作为游戏主场景的入口点
 * - 负责初始化并显示登录界面
 * - 协调各管理器的初始化
 * 
 * 初始化流程：
 * 1. onLoad 触发时，UIManager/PopupManager/TipManager 首次访问自动初始化
 * 2. 调用 UIManager.show('loginLayer') 加载并显示登录界面
 * 
 * 依赖模块：
 * - BaseUI：基础UI类，提供 UIManager、PopupManager、TipManager 等管理器
 * - UIManager：UI管理器，负责加载和显示各界面层
 * - LoginLayer：登录界面脚本
 */

import BaseUI from './base/BaseUI';

const { ccclass } = cc._decorator;

/**
 * Main - 游戏主场景入口类
 * 继承自 BaseUI，作为整个游戏的启动入口
 * 负责初始化界面并启动游戏流程
 */
@ccclass
export default class Main extends BaseUI {
    /**
     * 组件加载回调
     * 在组件首次加载时调用（早于 start）
     * 
     * 流程说明：
     * 1. 输出日志表示进入 onLoad 阶段
     * 2. 首次访问 this.UIManager 时，BaseUI 会自动实例化管理器
     * 3. 调用 UIManager.show('loginLayer') 加载并显示登录界面
     * 4. 输出日志表示登录界面调用完成
     * 
     * 注意：
     * - 此处未调用 super.onLoad()，因为 BaseUI 的 onLoad 为空实现
     * - UIManager 会在首次访问属性时自动初始化（懒加载模式）
     */
    onLoad() {
        console.log('Main: onLoad 执行');
        // 先初始化设置管理器，读取保存的音量设置
        this.SettingManager.init();
        // 首次访问 this.UIManager / this.PopupManager / this.TipManager 时自动初始化
        // 加载登录界面
        this.UIManager.show('loginLayer');
        console.log('Main: 调用 show(loginLayer) 完成');
    }
}