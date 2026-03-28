/**
 * 游戏中心化配置文件
 * 统一管理所有游戏参数，避免魔法数字散落各处
 * 
 * 使用方式：
 * 直接使用全局变量 GameConfig
 * const poolSize = GameConfig.CHESS.POOL_SIZE;
 */

const GameConfig = {
    // ==================== 棋盘配置 ====================
    BOARD: {
        DEFAULT_WIDTH: 15,          // 默认棋盘宽度（格子数）
        DEFAULT_HEIGHT: 15,         // 默认棋盘高度（格子数）
        DEFAULT_CHESS_WIDTH: 40,    // 默认棋子宽度（像素）
        DEFAULT_CHESS_HEIGHT: 40,   // 默认棋子高度（像素）
    },

    // ==================== 棋子配置 ====================
    CHESS: {
        POOL_SIZE: 30,              // 对象池初始大小
        PLAYER_BLACK: 1,            // 黑子玩家索引
        PLAYER_WHITE: 2,            // 白子玩家索引
        EMPTY: 0,                   // 空位标记
    },

    // ==================== 游戏模式 ====================
    GAME_MODE: {
        PVP: 'pvp',                 // 人人对战
        PVE: 'pve',                 // 人机对战
    },

    // ==================== AI 配置 ====================
    AI: {
        // 难度级别配置
        DIFFICULTY: {
            EASY: 'easy',
            MEDIUM: 'medium',
            HARD: 'hard',
        },
        
        // 各难度参数
        DIFFICULTY_SETTINGS: {
            easy: {
                searchDepth: 2,
                maxThinkTime: 10000,
                defenseWeight: 0.8,     // 防守权重（降低防守优先级）
                randomFactor: 0.3,      // 随机因素（增加不确定性）
            },
            medium: {
                searchDepth: 3,
                maxThinkTime: 15000,
                defenseWeight: 1.0,
                randomFactor: 0.1,
            },
            hard: {
                searchDepth: 4,
                maxThinkTime: 20000,
                defenseWeight: 1.2,     // 增强防守
                randomFactor: 0.0,      // 无随机
            },
        },

        // 棋型评分
        SCORES: {
            FIVE: 100000,               // 连五
            FOUR: 10000,                // 活四
            BLOCKED_FOUR: 1000,         // 冲四
            THREE: 100,                 // 活三
            BLOCKED_THREE: 10,          // 眠三
            TWO: 1,                     // 活二
        },

        // 启发式搜索范围
        SEARCH_RADIUS: 2,               // 搜索已有棋子周围N格
    },

    // ==================== 音效配置 ====================
    AUDIO: {
        // 音效名称映射
        NAMES: {
            PLACE_CHESS: 'placeChess',      // 落子音效
            PREVIEW: 'preview',              // 预览音效
            BUTTON_CLICK: 'buttonClick',     // 按钮点击音效
            MENU_CLICK: 'menuClick',         // 菜单点击音效
            WIN: 'win',                      // 胜利音效
            UNDO: 'buttonClick',             // 悔棋音效（复用按钮音效）
        },
        
        // 背景音乐名称
        BGM: {
            MENU: 'bgm_menu',               // 主菜单背景音乐
            BATTLE: 'bgm_battle',            // 战斗场景背景音乐
        },

        // 默认音量
        DEFAULT_MUSIC_VOLUME: 0.5,
        DEFAULT_SOUND_VOLUME: 1.0,
    },

    // ==================== UI 配置 ====================
    UI: {
        // 弹窗层级
        POPUP_Z_INDEX: 100,
        POPUP_TOP_Z_INDEX: 200,
        
        // 预览棋子透明度
        PREVIEW_OPACITY: 128,
        
        // 落子动画时长（秒）
        PLACE_ANIMATION_DURATION: 0.2,
    },

    // ==================== 胜利条件 ====================
    WIN: {
        REQUIRED_COUNT: 5,              // 连成5子获胜
        CHECK_DIRECTIONS: [             // 检查方向
            [1, 0],                     // 水平
            [0, 1],                     // 垂直
            [1, 1],                     // 右斜（右上到左下）
            [1, -1],                    // 左斜（左上到右下）
        ],
    },

    // ==================== 存储键名 ====================
    STORAGE_KEYS: {
        GAME_MODE: 'gameMode',
        MUSIC_VOLUME: 'setting_musicVolume',
        SOUND_VOLUME: 'setting_soundVolume',
        AI_DIFFICULTY: 'setting_aiDifficulty',
        GAME_STATS: 'gameStats',
        MOVE_HISTORY: 'moveHistory',
    },

    // ==================== 场景名称 ====================
    SCENES: {
        LOGIN: 'Login',
        BATTLE: 'Battle',
        SETTING: 'Setting',
    },

    // ==================== 回放配置 ====================
    REPLAY: {
        // 播放速度（毫秒/步）
        SPEED: {
            SLOW: 2000,                 // 慢速：2秒/步
            NORMAL: 1000,               // 正常：1秒/步
            FAST: 500,                  // 快速：0.5秒/步
            VERY_FAST: 250,             // 极快：0.25秒/步
        },
        
        // 默认播放速度
        DEFAULT_SPEED: 1000,
        
        // 回放模式状态
        MODE: {
            PLAYING: 'playing',         // 播放中
            PAUSED: 'paused',           // 已暂停
            STOPPED: 'stopped',         // 已停止
        },
    },
};

// 确保全局可访问
window.GameConfig = GameConfig;
