/**
 * SettingLayer - 设置弹窗
 * 继承 BasePopup 实现设置功能
 * 功能：音量控制（音乐/音效）、AI难度选择（简单/中等/困难）、返回、恢复默认设置
 * 
 * 使用方式：
 * - 通过 PopupManager.show('settingLayer') 显示
 * - 设置会自动保存到 SettingManager
 */

import BasePopup from './base/BasePopup';

const { ccclass, property } = cc._decorator;

@ccclass
export default class SettingLayer extends BasePopup {
    /** 音乐音量滑动条 */
    @property({ type: cc.Slider })
    musicVolumeSlider: cc.Slider = null!;

    /** 音效音量滑动条 */
    @property({ type: cc.Slider })
    soundVolumeSlider: cc.Slider = null!;

    /** 音乐音量百分比显示标签 */
    @property({ type: cc.Label })
    musicVolumeLabel: cc.Label = null!;

    /** 音效音量百分比显示标签 */
    @property({ type: cc.Label })
    soundVolumeLabel: cc.Label = null!;

    /** 简单难度按钮 */
    @property({ type: cc.Button })
    easyButton: cc.Button = null!;

    /** 中等难度按钮 */
    @property({ type: cc.Button })
    mediumButton: cc.Button = null!;

    /** 困难难度按钮 */
    @property({ type: cc.Button })
    hardButton: cc.Button = null!;

    /** 返回按钮 */
    @property({ type: cc.Button })
    btnBack: cc.Button = null!;

    /** 重置为默认按钮 */
    @property({ type: cc.Button })
    btnReset: cc.Button = null!;

    /**
     * 界面初始化
     * 调用父类方法初始化基类功能，加载当前设置到UI
     */
    protected initView(): void {
        // 调用父类方法执行基类初始化
        super.initView();
        // 加载当前设置到界面
        this.loadCurrentSettings();
    }

    /**
     * 事件初始化
     * 绑定滑动条和按钮的事件监听
     */
    protected initEvent(): void {
        // 调用父类方法初始化基类事件
        super.initEvent();
        // 绑定滑动条事件
        this.bindSliderEvents();
        // 绑定按钮事件
        this.bindButtonEvents();
    }

    onDisable() {
        this.unbindSliderEvents();
        this.unbindButtonEvents();
        super.onDisable();
    }

    /**
     * 绑定滑动条事件
     * 监听音乐和音效音量滑动条的 slide 事件
     */
    private bindSliderEvents(): void {
        if (this.musicVolumeSlider && this.musicVolumeSlider.node) {
            this.musicVolumeSlider.node.on('slide', this.onMusicVolumeChange, this);
        }
        if (this.soundVolumeSlider && this.soundVolumeSlider.node) {
            this.soundVolumeSlider.node.on('slide', this.onSoundVolumeChange, this);
        }
    }

    /**
     * 解绑滑动条事件
     * 移除音乐和音效音量滑动条的事件监听
     */
    private unbindSliderEvents(): void {
        if (this.musicVolumeSlider && this.musicVolumeSlider.node) {
            this.musicVolumeSlider.node.off('slide');
        }
        if (this.soundVolumeSlider && this.soundVolumeSlider.node) {
            this.soundVolumeSlider.node.off('slide');
        }
    }

    /**
     * 绑定按钮事件
     * 绑定所有设置按钮的点击事件
     */
    private bindButtonEvents(): void {
        this.bindButton(this.easyButton, this.onEasyClick);
        this.bindButton(this.mediumButton, this.onMediumClick);
        this.bindButton(this.hardButton, this.onHardClick);
        this.bindButton(this.btnBack, this.onBack);
        this.bindButton(this.btnReset, this.onReset);
    }

    /**
     * 解绑按钮事件
     * 移除所有设置按钮的点击事件监听
     */
    private unbindButtonEvents(): void {
        this.unbindButton(this.easyButton, this.onEasyClick);
        this.unbindButton(this.mediumButton, this.onMediumClick);
        this.unbindButton(this.hardButton, this.onHardClick);
        this.unbindButton(this.btnBack, this.onBack);
        this.unbindButton(this.btnReset, this.onReset);
    }

    /**
     * 绑定按钮点击事件
     * @param button - 要绑定的按钮组件
     * @param callback - 点击时调用的回调函数
     */
    private bindButton(button: cc.Button, callback: () => void): void {
        if (button && button.node) {
            button.node.on(cc.Node.EventType.TOUCH_START, callback, this);
        }
    }

    /**
     * 解绑按钮点击事件
     * @param button - 要解绑的按钮组件
     * @param callback - 之前绑定的回调函数
     */
    private unbindButton(button: cc.Button, callback: () => void): void {
        if (button && button.node) {
            button.node.off(cc.Node.EventType.TOUCH_START, callback, this);
        }
    }

    /**
     * 加载当前设置
     * 从 SettingManager 读取当前设置值并显示到界面
     */
    private loadCurrentSettings(): void {
        // 加载音乐音量
        if (this.musicVolumeSlider) {
            this.musicVolumeSlider.progress = this.SettingManager.getMusicVolume();
        }
        // 加载音效音量
        if (this.soundVolumeSlider) {
            this.soundVolumeSlider.progress = this.SettingManager.getSoundVolume();
        }
        // 更新音量显示文本
        this.updateVolumeLabels();
        // 更新难度按钮状态
        this.updateDifficultyButtons();
    }

    /**
     * 更新音量显示
     * 根据滑动条进度更新音量百分比文本
     */
    private updateVolumeLabels(): void {
        // 更新音乐音量显示
        if (this.musicVolumeLabel && this.musicVolumeSlider) {
            const musicPercent = Math.round(this.musicVolumeSlider.progress * 100);
            this.musicVolumeLabel.string = `${musicPercent}%`;
        }
        // 更新音效音量显示
        if (this.soundVolumeLabel && this.soundVolumeSlider) {
            const soundPercent = Math.round(this.soundVolumeSlider.progress * 100);
            this.soundVolumeLabel.string = `${soundPercent}%`;
        }
    }

    /**
     * 更新难度按钮状态
     * 根据当前AI难度设置按钮的可交互状态，当前选中的难度按钮禁用
     */
    private updateDifficultyButtons(): void {
        const currentDifficulty = this.SettingManager.getAIDifficulty();

        // 简单按钮：非简单难度时可交互
        if (this.easyButton) {
            this.easyButton.interactable = currentDifficulty !== 'easy';
        }
        // 中等按钮：非中等难度时可交互
        if (this.mediumButton) {
            this.mediumButton.interactable = currentDifficulty !== 'medium';
        }
        // 困难按钮：非困难难度时可交互
        if (this.hardButton) {
            this.hardButton.interactable = currentDifficulty !== 'hard';
        }
    }

    /**
     * 音乐音量变化回调
     * 滑动条值变化时调用，保存设置并更新显示
     */
    private onMusicVolumeChange(): void {
        if (!this.musicVolumeSlider) return;
        const volume = this.musicVolumeSlider.progress;
        this.SettingManager.setMusicVolume(volume);
        this.updateVolumeLabels();
    }

    /**
     * 音效音量变化回调
     * 滑动条值变化时调用，保存设置、更新显示并播放音效
     */
    private onSoundVolumeChange(): void {
        if (!this.soundVolumeSlider) return;
        const volume = this.soundVolumeSlider.progress;
        this.SettingManager.setSoundVolume(volume);
        this.updateVolumeLabels();
        this.AudioManager.play('buttonClick');
    }

    /**
     * 简单难度点击处理
     * 设置AI难度为简单，更新按钮状态，播放点击音效
     */
    private onEasyClick(): void {
        this.SettingManager.setAIDifficulty('easy');
        this.updateDifficultyButtons();
        this.AudioManager.play('buttonClick');
    }

    /**
     * 中等难度点击处理
     * 设置AI难度为中等，更新按钮状态，播放点击音效
     */
    private onMediumClick(): void {
        this.SettingManager.setAIDifficulty('medium');
        this.updateDifficultyButtons();
        this.AudioManager.play('buttonClick');
    }

    /**
     * 困难难度点击处理
     * 设置AI难度为困难，更新按钮状态，播放点击音效
     */
    private onHardClick(): void {
        this.SettingManager.setAIDifficulty('hard');
        this.updateDifficultyButtons();
        this.AudioManager.play('buttonClick');
    }

    /**
     * 返回按钮点击处理
     * 播放返回音效，关闭设置弹窗
     */
    private onBack(): void {
        this.AudioManager.play('menuClick');
        this.onClose();
    }

    /**
     * 重置按钮点击处理
     * 将所有设置恢复为默认值，重新加载界面显示
     */
    private onReset(): void {
        this.AudioManager.play('buttonClick');
        this.SettingManager.resetToDefaults();
        this.loadCurrentSettings();
    }
}