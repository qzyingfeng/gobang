/**
 * SettingManager - 设置管理器
 * 处理游戏设置的保存和加载
 * 功能：音量控制、AI难度选择、设置持久化
 */

import GameConfig from '../config/GameConfig';
import AudioManager from './AudioManager';

class SettingManagerClass {
    /** 单例实例 */
    private static _instance: SettingManagerClass | null = null;
    /** 存储键名 */
    private KEYS: any;
    /** AI难度选项 */
    private AI_DIFFICULTY: any;
    /** 默认设置 */
    private defaults: { musicVolume: number; soundVolume: number; aiDifficulty: string };
    /** 当前设置 */
    private settings: { musicVolume: number; soundVolume: number; aiDifficulty: string };

    private constructor() {
        this.KEYS = GameConfig.STORAGE_KEYS || {
            MUSIC_VOLUME: 'musicVolume',
            SOUND_VOLUME: 'soundVolume',
            AI_DIFFICULTY: 'aiDifficulty',
        };
        this.AI_DIFFICULTY = GameConfig.AI?.DIFFICULTY || {
            EASY: 'easy',
            MEDIUM: 'medium',
            HARD: 'hard',
        };
        const defaultMusicVolume = GameConfig.AUDIO?.DEFAULT_MUSIC_VOLUME ?? 0.5;
        const defaultSoundVolume = GameConfig.AUDIO?.DEFAULT_SOUND_VOLUME ?? 1.0;
        const defaultAiDifficulty = this.AI_DIFFICULTY.MEDIUM || 'medium';
        this.defaults = {
            musicVolume: defaultMusicVolume,
            soundVolume: defaultSoundVolume,
            aiDifficulty: defaultAiDifficulty,
        };
        this.settings = { ...this.defaults };
    }

    /**
     * 获取单例实例
     */
    static getInstance(): SettingManagerClass {
        if (!this._instance) {
            this._instance = new SettingManagerClass();
        }
        return this._instance;
    }

    /**
     * 初始化设置管理器
     */
    init(): void {
        this.settings = {
            musicVolume: this.loadSetting(this.KEYS.MUSIC_VOLUME, this.defaults.musicVolume),
            soundVolume: this.loadSetting(this.KEYS.SOUND_VOLUME, this.defaults.soundVolume),
            aiDifficulty: this.loadSetting(this.KEYS.AI_DIFFICULTY, this.defaults.aiDifficulty),
        };
        this.updateMusicVolume();
        this.updateSoundVolume();
        cc.log('设置管理器初始化完成:', this.settings);
    }

    /**
     * 加载设置
     */
    private loadSetting(key: string, defaultValue: any): any {
        const value = cc.sys.localStorage.getItem(key);
        if (value === null || value === undefined) {
            return defaultValue;
        }
        try {
            return JSON.parse(value);
        } catch (e) {
            return value;
        }
    }

    /**
     * 保存设置
     */
    private saveSetting(key: string, value: any): void {
        cc.sys.localStorage.setItem(key, JSON.stringify(value));
    }

    /**
     * 获取背景音乐音量
     */
    getMusicVolume(): number {
        return this.settings.musicVolume;
    }

    /**
     * 设置背景音乐音量
     */
    setMusicVolume(volume: number): void {
        this.settings.musicVolume = Math.max(0, Math.min(1, volume));
        this.saveSetting(this.KEYS.MUSIC_VOLUME, this.settings.musicVolume);
        this.updateMusicVolume();
    }

    /**
     * 更新音频管理器音量
     */
    private updateMusicVolume(): void {
        AudioManager.getInstance().setMusicVolume(this.settings.musicVolume);
    }

    /**
     * 获取音效音量
     */
    getSoundVolume(): number {
        return this.settings.soundVolume;
    }

    /**
     * 设置音效音量
     */
    setSoundVolume(volume: number): void {
        this.settings.soundVolume = Math.max(0, Math.min(1, volume));
        this.saveSetting(this.KEYS.SOUND_VOLUME, this.settings.soundVolume);
        this.updateSoundVolume();
    }

    /**
     * 更新音效默认音量
     */
    private updateSoundVolume(): void {
        AudioManager.getInstance().setDefaultVolume(this.settings.soundVolume);
    }

    /**
     * 获取AI难度
     */
    getAIDifficulty(): string {
        return this.settings.aiDifficulty;
    }

    /**
     * 设置AI难度
     */
    setAIDifficulty(difficulty: string): void {
        const upperDiff = difficulty.toUpperCase();
        if (this.AI_DIFFICULTY[upperDiff]) {
            this.settings.aiDifficulty = difficulty;
            this.saveSetting(this.KEYS.AI_DIFFICULTY, this.settings.aiDifficulty);
        }
    }

    /**
     * 获取所有设置
     */
    getAllSettings(): { musicVolume: number; soundVolume: number; aiDifficulty: string } {
        return { ...this.settings };
    }

    /**
     * 重置所有设置为默认值
     */
    resetToDefaults(): void {
        this.settings = { ...this.defaults };
        this.saveSetting(this.KEYS.MUSIC_VOLUME, this.settings.musicVolume);
        this.saveSetting(this.KEYS.SOUND_VOLUME, this.settings.soundVolume);
        this.saveSetting(this.KEYS.AI_DIFFICULTY, this.settings.aiDifficulty);
        this.updateMusicVolume();
        this.updateSoundVolume();
        cc.log('设置已重置为默认值');
    }
}

export default SettingManagerClass;