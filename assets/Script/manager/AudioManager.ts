/**
 * AudioManager - 音频管理器
 * 通过名称播放音效
 * 使用方法：AudioManager.getInstance().play('placeChess')
 * 音频文件需放在 resources/Audio 目录下，支持 .mp3/.wav
 * 如果音效文件不存在，程序会继续运行，不会崩溃
 */

class AudioManagerClass {
    /** 单例实例 */
    private static _instance: AudioManagerClass | null = null;
    /** 已加载的音频剪辑缓存 */
    private audioClips: { [name: string]: cc.AudioClip } = {};
    /** 默认音量 */
    private defaultVolume: number = 1.0;
    /** 背景音乐音量 */
    private musicVolume: number = 1.0;
    /** 正在播放的音效ID缓存 */
    private playingIds: { [name: string]: number } = {};
    /** 当前播放的背景音乐ID */
    private musicAudioId: number = -1;
    /** 当前播放的背景音乐名称 */
    private currentMusicName: string | null = null;
    /** 是否显示错误日志 */
    showErrors: boolean = true;

    private constructor() {}

    /**
     * 获取单例实例
     */
    static getInstance(): AudioManagerClass {
        if (!this._instance) {
            this._instance = new AudioManagerClass();
        }
        return this._instance;
    }

    /**
     * 初始化管理器
     * @param audioNames 要预加载的音频名称数组
     * @param callback 加载完成回调
     */
    init(audioNames: string[], callback?: () => void): void {
        if (!audioNames || audioNames.length === 0) {
            if (callback) callback();
            return;
        }

        let loadedCount = 0;
        const totalCount = audioNames.length;

        for (const name of audioNames) {
            this.loadAudioClip(name, (clip) => {
                loadedCount++;
                if (loadedCount >= totalCount && callback) {
                    callback();
                }
            });
        }
    }

    /**
     * 加载单个音频剪辑
     */
    private loadAudioClip(audioName: string, callback?: (clip: cc.AudioClip | null) => void): void {
        if (this.audioClips[audioName]) {
            if (callback) callback(this.audioClips[audioName]);
            return;
        }

        cc.resources.load(`Audio/${audioName}`, cc.AudioClip, (err, clip: cc.AudioClip) => {
            if (err) {
                if (this.showErrors) {
                    cc.warn(`音频加载失败: ${audioName}`);
                }
                if (callback) callback(null);
                return;
            }
            this.audioClips[audioName] = clip!;
            if (callback) callback(clip);
        });
    }

    /**
     * 播放音效
     * @param audioName 音频名称
     * @param loop 是否循环
     * @param volume 音量（0-1）
     */
    play(audioName: string, loop: boolean = false, volume: number = this.defaultVolume): number {
        if (this.audioClips[audioName]) {
            return this.playClip(this.audioClips[audioName], loop, volume, audioName);
        }

        this.loadAudioClip(audioName, (clip) => {
            if (clip) {
                this.playClip(clip, loop, volume, audioName);
            }
        });

        return -1;
    }

    /**
     * 播放音频剪辑内部方法
     */
    private playClip(clip: cc.AudioClip, loop: boolean, volume: number, audioName: string): number {
        try {
            const audioId = cc.audioEngine.play(clip, loop, volume);
            this.playingIds[audioName] = audioId;
            return audioId;
        } catch (e) {
            if (this.showErrors) {
                cc.warn(`音效播放失败: ${audioName}`);
            }
            return -1;
        }
    }

    /**
     * 停止指定音效
     */
    stop(audioName: string): void {
        if (this.playingIds[audioName] !== undefined) {
            try {
                cc.audioEngine.stop(this.playingIds[audioName]);
            } catch (e) {
                // 忽略停止错误
            }
            delete this.playingIds[audioName];
        }
    }

    /**
     * 停止所有音效
     */
    stopAll(): void {
        try {
            cc.audioEngine.stopAll();
        } catch (e) {
            // 忽略错误
        }
        this.playingIds = {};
    }

    /**
     * 设置默认音量
     */
    setDefaultVolume(volume: number): void {
        this.defaultVolume = Math.max(0, Math.min(1, volume));
        cc.audioEngine.setEffectsVolume(this.defaultVolume);
    }

    /**
     * 设置背景音乐音量
     */
    setMusicVolume(volume: number): void {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        cc.audioEngine.setMusicVolume(this.musicVolume);
        if (this.musicAudioId !== -1) {
            try {
                cc.audioEngine.setVolume(this.musicAudioId, this.musicVolume);
            } catch (e) {
                // 忽略错误
            }
        }
    }

    /**
     * 获取背景音乐音量
     */
    getMusicVolume(): number {
        return this.musicVolume;
    }

    /**
     * 播放背景音乐
     */
    playMusic(audioName: string, loop: boolean = true): void {
        if (this.currentMusicName === audioName && this.musicAudioId !== -1) {
            return;
        }

        this.stopMusic();

        if (this.audioClips[audioName]) {
            this.playMusicClip(this.audioClips[audioName], loop, audioName);
            return;
        }

        this.loadAudioClip(audioName, (clip) => {
            if (clip) {
                this.playMusicClip(clip, loop, audioName);
            }
        });
    }

    /**
     * 播放背景音乐剪辑内部方法
     */
    private playMusicClip(clip: cc.AudioClip, loop: boolean, audioName: string): void {
        try {
            this.musicAudioId = cc.audioEngine.play(clip, loop, this.musicVolume);
            this.currentMusicName = audioName;
        } catch (e) {
            cc.warn(`背景音乐播放失败: ${audioName}`);
        }
    }

    /**
     * 停止背景音乐
     */
    stopMusic(): void {
        if (this.musicAudioId !== -1) {
            try {
                cc.audioEngine.stop(this.musicAudioId);
            } catch (e) {
                // 忽略错误
            }
            this.musicAudioId = -1;
            this.currentMusicName = null;
        }
    }

    /**
     * 预加载所有Audio目录下的音频
     */
    preloadAll(callback?: () => void): void {
        cc.resources.loadDir('Audio', cc.AudioClip, (err, clips: cc.AudioClip[]) => {
            if (err) {
                if (this.showErrors) {
                    cc.warn(`音频目录加载失败: ${err}`);
                }
                if (callback) callback();
                return;
            }

            for (const clip of clips) {
                this.audioClips[clip.name] = clip;
            }

            if (callback) callback();
        });
    }

    /**
     * 检查音效是否已加载
     */
    isLoaded(audioName: string): boolean {
        return !!this.audioClips[audioName];
    }

    /**
     * 获取已加载的所有音效名称
     */
    getLoadedAudioNames(): string[] {
        return Object.keys(this.audioClips);
    }
}

export default AudioManagerClass;