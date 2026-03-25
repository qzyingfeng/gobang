/**
 * 静态音效管理器 - 通过名称播放音效
 * 使用方法：AudioManager.play('placeChess')
 * 音频文件需放在 assets/resources/Audio 目录下，支持 .mp3/.wav
 * 如果音效文件不存在，程序会继续运行，不会崩溃
 */

var AudioManager = {
    // 已加载的音频剪辑缓存
    _audioClips: {},
    
    // 默认音量
    _defaultVolume: 1.0,
    
    // 正在播放的音频ID缓存
    _playingIds: {},
    
    // 是否显示错误日志（可设置为false以完全静默）
    showErrors: true,
    
    /**
     * 初始化管理器（可选，用于预加载）
     * @param {Array} audioNames - 要预加载的音频名称数组，如 ['placeChess', 'win']
     * @param {Function} callback - 加载完成回调
     */
    init: function(audioNames, callback) {
        if (!audioNames || audioNames.length === 0) {
            if (callback) callback();
            return;
        }
        
        var loadedCount = 0;
        var totalCount = audioNames.length;
        
        for (var i = 0; i < audioNames.length; i++) {
            var name = audioNames[i];
            this._loadAudioClip(name, function(clip) {
                loadedCount++;
                if (loadedCount >= totalCount && callback) {
                    callback();
                }
            });
        }
    },
    
    /**
     * 加载单个音频剪辑
     * @param {string} audioName - 音频名称（不带扩展名）
     * @param {Function} callback - 加载完成回调，参数为cc.AudioClip
     */
    _loadAudioClip: function(audioName, callback) {
        if (this._audioClips[audioName]) {
            cc.log('音频已缓存:', audioName);
            if (callback) callback(this._audioClips[audioName]);
            return;
        }
        
        var self = this;
        cc.log('开始加载音频:', audioName);
        cc.loader.loadRes('Audio/' + audioName, cc.AudioClip, function(err, clip) {
            if (err) {
                if (self.showErrors) {
                    cc.warn('音频文件未找到或加载失败:', audioName, '(游戏将继续运行)');
                }
                cc.log('音频加载失败:', audioName, err);
                if (callback) callback(null);
                return;
            }
            cc.log('音频加载成功:', audioName, clip);
            self._audioClips[audioName] = clip;
            if (callback) callback(clip);
        });
    },
    
    /**
     * 播放音效
     * @param {string} audioName - 音频名称（不带扩展名）
     * @param {boolean} loop - 是否循环播放，默认false
     * @param {number} volume - 音量（0-1），默认使用_defaultVolume
     * @returns {number} 音频ID，可用于停止播放，如果失败返回-1
     */
    play: function(audioName, loop, volume) {
        var self = this;
        loop = loop || false;
        volume = volume !== undefined ? volume : this._defaultVolume;
        cc.log('播放音效请求:', audioName, 'loop:', loop, 'volume:', volume);
        
        // 如果已加载，直接播放
        if (this._audioClips[audioName]) {
            cc.log('音效已缓存，直接播放:', audioName);
            return this._playClip(this._audioClips[audioName], loop, volume, audioName);
        }
        
        // 否则先加载再播放
        cc.log('音效未缓存，开始加载:', audioName);
        this._loadAudioClip(audioName, function(clip) {
            if (clip) {
                cc.log('音效加载完成，开始播放:', audioName);
                self._playClip(clip, loop, volume, audioName);
            } else {
                cc.log('音效加载失败，无法播放:', audioName);
            }
            // 如果clip为null，静默失败，不播放但也不报错
        });
        
        return -1;
    },
    
    /**
     * 播放音频剪辑内部方法
     */
    _playClip: function(clip, loop, volume, audioName) {
        try {
            cc.log('调用cc.audioEngine.play:', audioName, 'loop:', loop, 'volume:', volume);
            var audioId = cc.audioEngine.play(clip, loop, volume);
            cc.log('播放成功，audioId:', audioId, '音效:', audioName);
            this._playingIds[audioName] = audioId;
            return audioId;
        } catch (e) {
            if (this.showErrors) {
                cc.warn('音效播放失败:', audioName, '(游戏将继续运行)');
            }
            cc.log('播放异常:', audioName, e);
            return -1;
        }
    },
    
    /**
     * 停止指定音效
     * @param {string} audioName - 音频名称
     */
    stop: function(audioName) {
        if (this._playingIds[audioName] !== undefined) {
            try {
                cc.audioEngine.stop(this._playingIds[audioName]);
            } catch (e) {
                // 忽略停止错误
            }
            delete this._playingIds[audioName];
        }
    },
    
    /**
     * 停止所有音效
     */
    stopAll: function() {
        try {
            cc.audioEngine.stopAll();
        } catch (e) {
            // 忽略停止错误
        }
        this._playingIds = {};
    },
    
    /**
     * 设置默认音量
     * @param {number} volume - 音量（0-1）
     */
    setDefaultVolume: function(volume) {
        this._defaultVolume = Math.max(0, Math.min(1, volume));
    },
    
    /**
     * 设置背景音乐音量
     * @param {number} volume - 音量（0-1）
     */
    setMusicVolume: function(volume) {
        this._musicVolume = Math.max(0, Math.min(1, volume));
        if (this._musicAudioId !== -1) {
            try {
                cc.audioEngine.setVolume(this._musicAudioId, this._musicVolume);
            } catch (e) {
                // 忽略错误
            }
        }
    },
    
    /**
     * 获取背景音乐音量
     * @returns {number} 音量（0-1）
     */
    getMusicVolume: function() {
        return this._musicVolume;
    },
    
    /**
     * 播放背景音乐
     * @param {string} audioName - 音频名称
     * @param {boolean} loop - 是否循环播放
     */
    playMusic: function(audioName, loop) {
        var self = this;
        loop = loop !== undefined ? loop : true;
        
        // 如果正在播放相同的音乐，不重复播放
        if (this._currentMusicName === audioName && this._musicAudioId !== -1) {
            return;
        }
        
        // 停止当前背景音乐
        this.stopMusic();
        
        // 如果已加载，直接播放
        if (this._audioClips[audioName]) {
            this._playMusicClip(this._audioClips[audioName], loop, audioName);
            return;
        }
        
        // 否则先加载再播放
        this._loadAudioClip(audioName, function(clip) {
            if (clip) {
                self._playMusicClip(clip, loop, audioName);
            }
        });
    },
    
    /**
     * 播放背景音乐剪辑内部方法
     */
    _playMusicClip: function(clip, loop, audioName) {
        try {
            this._musicAudioId = cc.audioEngine.play(clip, loop, this._musicVolume);
            this._currentMusicName = audioName;
        } catch (e) {
            cc.warn('背景音乐播放失败:', audioName);
        }
    },
    
    /**
     * 停止背景音乐
     */
    stopMusic: function() {
        if (this._musicAudioId !== -1) {
            try {
                cc.audioEngine.stop(this._musicAudioId);
            } catch (e) {
                // 忽略停止错误
            }
            this._musicAudioId = -1;
            this._currentMusicName = null;
        }
    },
    
    /**
     * 预加载所有Audio目录下的音频（谨慎使用，可能很多）
     * @param {Function} callback - 加载完成回调
     */
    preloadAll: function(callback) {
        var self = this;
        cc.loader.loadResDir('Audio', cc.AudioClip, function(err, clips) {
            if (err) {
                if (self.showErrors) {
                    cc.warn('音频目录加载失败:', err, '(游戏将继续运行)');
                }
                if (callback) callback();
                return;
            }
            
            for (var i = 0; i < clips.length; i++) {
                var clip = clips[i];
                var name = clip.name; // 假设文件名就是音频名称
                self._audioClips[name] = clip;
            }
            
            if (callback) callback();
        });
    },
    
    /**
     * 检查音效是否已加载
     * @param {string} audioName - 音频名称
     * @returns {boolean} 是否已加载
     */
    isLoaded: function(audioName) {
        return !!this._audioClips[audioName];
    },
    
    /**
     * 获取已加载的所有音效名称
     * @returns {Array} 已加载的音效名称数组
     */
    getLoadedAudioNames: function() {
        return Object.keys(this._audioClips);
    }
};

// 确保全局可访问
window.AudioManager = AudioManager;