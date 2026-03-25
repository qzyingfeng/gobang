/**
 * 设置场景脚本
 * 功能：音量控制、AI难度选择、返回主菜单
 */

// GameConfig 为全局变量，无需 require

cc.Class({
    extends: cc.Component,

    properties: {
        // 音量滑动条
        musicVolumeSlider: cc.Slider,
        soundVolumeSlider: cc.Slider,
        
        // 音量数值显示
        musicVolumeLabel: cc.Label,
        soundVolumeLabel: cc.Label,
        
        // AI难度按钮
        easyButton: cc.Button,
        mediumButton: cc.Button,
        hardButton: cc.Button,
        
        // 返回按钮
        backButton: cc.Button,
        
        // 重置按钮
        resetButton: cc.Button,
    },

    onLoad() {
        // 初始化设置管理器
        SettingManager.init();
        
        // 加载当前设置
        this._loadCurrentSettings();
    },

    start() {
        // 绑定滑动条事件
        if (this.musicVolumeSlider) {
            this.musicVolumeSlider.node.on('slide', this.onMusicVolumeChange, this);
        }
        if (this.soundVolumeSlider) {
            this.soundVolumeSlider.node.on('slide', this.onSoundVolumeChange, this);
        }
        
        // 绑定难度按钮事件
        if (this.easyButton) {
            this.easyButton.node.on(cc.Node.EventType.TOUCH_START, 
                function() { this.setAIDifficulty('easy'); }.bind(this), this);
        }
        if (this.mediumButton) {
            this.mediumButton.node.on(cc.Node.EventType.TOUCH_START, 
                function() { this.setAIDifficulty('medium'); }.bind(this), this);
        }
        if (this.hardButton) {
            this.hardButton.node.on(cc.Node.EventType.TOUCH_START, 
                function() { this.setAIDifficulty('hard'); }.bind(this), this);
        }
        
        // 绑定返回按钮事件
        if (this.backButton) {
            this.backButton.node.on(cc.Node.EventType.TOUCH_START, this.onBack, this);
        }
        
        // 绑定重置按钮事件
        if (this.resetButton) {
            this.resetButton.node.on(cc.Node.EventType.TOUCH_START, this.onReset, this);
        }
    },

    /**
     * 加载当前设置
     */
    _loadCurrentSettings() {
        // 设置音量滑动条
        if (this.musicVolumeSlider) {
            this.musicVolumeSlider.progress = SettingManager.getMusicVolume();
        }
        if (this.soundVolumeSlider) {
            this.soundVolumeSlider.progress = SettingManager.getSoundVolume();
        }
        
        // 更新音量显示
        this._updateVolumeLabels();
        
        // 设置难度按钮状态
        this._updateDifficultyButtons();
    },

    /**
     * 更新音量数值显示
     */
    _updateVolumeLabels() {
        if (this.musicVolumeLabel && this.musicVolumeSlider) {
            var musicPercent = Math.round(this.musicVolumeSlider.progress * 100);
            this.musicVolumeLabel.string = musicPercent + "%";
        }
        if (this.soundVolumeLabel && this.soundVolumeSlider) {
            var soundPercent = Math.round(this.soundVolumeSlider.progress * 100);
            this.soundVolumeLabel.string = soundPercent + "%";
        }
    },

    /**
     * 更新难度按钮状态
     */
    _updateDifficultyButtons() {
        var currentDifficulty = SettingManager.getAIDifficulty();
        
        // 更新按钮样式（高亮当前选中的难度）
        if (this.easyButton) {
            this.easyButton.interactable = currentDifficulty !== 'easy';
        }
        if (this.mediumButton) {
            this.mediumButton.interactable = currentDifficulty !== 'medium';
        }
        if (this.hardButton) {
            this.hardButton.interactable = currentDifficulty !== 'hard';
        }
    },

    /**
     * 背景音乐音量变化
     */
    onMusicVolumeChange() {
        var volume = this.musicVolumeSlider.progress;
        SettingManager.setMusicVolume(volume);
        this._updateVolumeLabels();
    },

    /**
     * 音效音量变化
     */
    onSoundVolumeChange() {
        var volume = this.soundVolumeSlider.progress;
        SettingManager.setSoundVolume(volume);
        this._updateVolumeLabels();
        
        // 播放测试音效
        AudioManager.play(GameConfig.AUDIO.NAMES.BUTTON_CLICK);
    },

    /**
     * 设置AI难度
     * @param {string} difficulty - 难度级别
     */
    setAIDifficulty(difficulty) {
        SettingManager.setAIDifficulty(difficulty);
        this._updateDifficultyButtons();
        
        // 播放按钮音效
        AudioManager.play(GameConfig.AUDIO.NAMES.BUTTON_CLICK);
    },

    /**
     * 返回主菜单
     */
    onBack() {
        // 播放按钮音效
        AudioManager.play(GameConfig.AUDIO.NAMES.MENU_CLICK);
        
        cc.director.loadScene(GameConfig.SCENES.LOGIN);
    },

    /**
     * 重置设置
     */
    onReset() {
        // 播放按钮音效
        AudioManager.play(GameConfig.AUDIO.NAMES.BUTTON_CLICK);
        
        SettingManager.resetToDefaults();
        this._loadCurrentSettings();
    },

    onDestroy() {
        // 清理事件监听
        if (this.musicVolumeSlider && this.musicVolumeSlider.node) {
            this.musicVolumeSlider.node.off('slide');
        }
        if (this.soundVolumeSlider && this.soundVolumeSlider.node) {
            this.soundVolumeSlider.node.off('slide');
        }
        if (this.easyButton && this.easyButton.node) {
            this.easyButton.node.off(cc.Node.EventType.TOUCH_START);
        }
        if (this.mediumButton && this.mediumButton.node) {
            this.mediumButton.node.off(cc.Node.EventType.TOUCH_START);
        }
        if (this.hardButton && this.hardButton.node) {
            this.hardButton.node.off(cc.Node.EventType.TOUCH_START);
        }
        if (this.backButton && this.backButton.node) {
            this.backButton.node.off(cc.Node.EventType.TOUCH_START);
        }
        if (this.resetButton && this.resetButton.node) {
            this.resetButton.node.off(cc.Node.EventType.TOUCH_START);
        }
    },
});