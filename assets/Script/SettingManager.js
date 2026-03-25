/**
 * 设置管理器 - 处理游戏设置的保存和加载
 * 功能：音量控制、AI难度选择、设置持久化
 */

// GameConfig 为全局变量，无需 require

var SettingManager = {
    // 使用中心化配置的键名
    KEYS: GameConfig.STORAGE_KEYS,
    
    // 使用中心化配置的AI难度选项
    AI_DIFFICULTY: GameConfig.AI.DIFFICULTY,
    
    // 使用中心化配置的默认设置
    _defaults: {
        musicVolume: GameConfig.AUDIO.DEFAULT_MUSIC_VOLUME,
        soundVolume: GameConfig.AUDIO.DEFAULT_SOUND_VOLUME,
        aiDifficulty: GameConfig.AI.DIFFICULTY.MEDIUM,
    },
    
    // 当前设置
    _settings: {},
    
    /**
     * 初始化设置管理器
     */
    init: function() {
        this._settings = {
            musicVolume: this._loadSetting(this.KEYS.MUSIC_VOLUME, this._defaults.musicVolume),
            soundVolume: this._loadSetting(this.KEYS.SOUND_VOLUME, this._defaults.soundVolume),
            aiDifficulty: this._loadSetting(this.KEYS.AI_DIFFICULTY, this._defaults.aiDifficulty),
        };
        cc.log("设置管理器初始化完成:", this._settings);
    },
    
    /**
     * 加载设置
     * @param {string} key - 设置键名
     * @param {*} defaultValue - 默认值
     * @returns {*} 设置值
     */
    _loadSetting: function(key, defaultValue) {
        var value = cc.sys.localStorage.getItem(key);
        if (value === null || value === undefined) {
            return defaultValue;
        }
        // 尝试解析JSON
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    },
    
    /**
     * 保存设置
     * @param {string} key - 设置键名
     * @param {*} value - 设置值
     */
    _saveSetting: function(key, value) {
        cc.sys.localStorage.setItem(key, JSON.stringify(value));
    },
    
    /**
     * 获取背景音乐音量
     * @returns {number} 音量值 (0-1)
     */
    getMusicVolume: function() {
        return this._settings.musicVolume;
    },
    
    /**
     * 设置背景音乐音量
     * @param {number} volume - 音量值 (0-1)
     */
    setMusicVolume: function(volume) {
        this._settings.musicVolume = Math.max(0, Math.min(1, volume));
        this._saveSetting(this.KEYS.MUSIC_VOLUME, this._settings.musicVolume);
        
        // 更新背景音乐音量
        AudioManager.setMusicVolume(this._settings.musicVolume);
    },
    
    /**
     * 获取音效音量
     * @returns {number} 音量值 (0-1)
     */
    getSoundVolume: function() {
        return this._settings.soundVolume;
    },
    
    /**
     * 设置音效音量
     * @param {number} volume - 音量值 (0-1)
     */
    setSoundVolume: function(volume) {
        this._settings.soundVolume = Math.max(0, Math.min(1, volume));
        this._saveSetting(this.KEYS.SOUND_VOLUME, this._settings.soundVolume);
        
        // 更新默认音量
        AudioManager.setDefaultVolume(this._settings.soundVolume);
    },
    
    /**
     * 获取AI难度
     * @returns {string} 难度级别
     */
    getAIDifficulty: function() {
        return this._settings.aiDifficulty;
    },
    
    /**
     * 设置AI难度
     * @param {string} difficulty - 难度级别
     */
    setAIDifficulty: function(difficulty) {
        if (this.AI_DIFFICULTY[difficulty.toUpperCase()]) {
            this._settings.aiDifficulty = difficulty;
            this._saveSetting(this.KEYS.AI_DIFFICULTY, this._settings.aiDifficulty);
        }
    },
    
    /**
     * 获取所有设置
     * @returns {Object} 设置对象
     */
    getAllSettings: function() {
        return JSON.parse(JSON.stringify(this._settings));
    },
    
    /**
     * 重置所有设置为默认值
     */
    resetToDefaults: function() {
        this._settings = JSON.parse(JSON.stringify(this._defaults));
        this._saveSetting(this.KEYS.MUSIC_VOLUME, this._settings.musicVolume);
        this._saveSetting(this.KEYS.SOUND_VOLUME, this._settings.soundVolume);
        this._saveSetting(this.KEYS.AI_DIFFICULTY, this._settings.aiDifficulty);
        
        // 应用设置
        AudioManager.setMusicVolume(this._settings.musicVolume);
        AudioManager.setDefaultVolume(this._settings.soundVolume);
        
        cc.log("设置已重置为默认值");
    },
};

// 确保全局可访问
window.SettingManager = SettingManager;