/**
 * 游戏中心化配置文件
 * 统一管理所有游戏参数，避免魔法数字散落各处
 * 
 * 使用方式：
 * const GameConfig = require('./config/GameConfig');
 * const poolSize = GameConfig.CHESS.POOL_SIZE;
 */

const GameConfig = {
    BOARD: {
        DEFAULT_WIDTH: 15,
        DEFAULT_HEIGHT: 15,
        DEFAULT_CHESS_WIDTH: 40,
        DEFAULT_CHESS_HEIGHT: 40,
    },

    CHESS: {
        POOL_SIZE: 30,
        PLAYER_BLACK: 1,
        PLAYER_WHITE: 2,
        EMPTY: 0,
    },

    GAME_MODE: {
        PVP: 'pvp',
        PVE: 'pve',
    },

    AI: {
        DIFFICULTY: {
            EASY: 'easy',
            MEDIUM: 'medium',
            HARD: 'hard',
        },
        DIFFICULTY_SETTINGS: {
            easy: {
                searchDepth: 2,
                maxThinkTime: 10000,
                defenseWeight: 0.8,
                randomFactor: 0.3,
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
                defenseWeight: 1.2,
                randomFactor: 0.0,
            },
        },
        SCORES: {
            FIVE: 100000,
            FOUR: 10000,
            BLOCKED_FOUR: 1000,
            THREE: 100,
            BLOCKED_THREE: 10,
            TWO: 1,
        },
        SEARCH_RADIUS: 2,
    },

    AUDIO: {
        NAMES: {
            PLACE_CHESS: 'placeChess',
            PREVIEW: 'preview',
            BUTTON_CLICK: 'buttonClick',
            MENU_CLICK: 'menuClick',
            WIN: 'win',
            UNDO: 'buttonClick',
        },
        BGM: {
            MENU: 'bgm_menu',
            BATTLE: 'bgm_battle',
        },
        DEFAULT_MUSIC_VOLUME: 0.5,
        DEFAULT_SOUND_VOLUME: 1.0,
    },

    UI: {
        POPUP_Z_INDEX: 100,
        POPUP_TOP_Z_INDEX: 200,
        PREVIEW_OPACITY: 128,
        PLACE_ANIMATION_DURATION: 0.2,
    },

    WIN: {
        REQUIRED_COUNT: 5,
        CHECK_DIRECTIONS: [[1, 0], [0, 1], [1, 1], [1, -1]],
    },

    STORAGE_KEYS: {
        GAME_MODE: 'gameMode',
        MUSIC_VOLUME: 'setting_musicVolume',
        SOUND_VOLUME: 'setting_soundVolume',
        AI_DIFFICULTY: 'setting_aiDifficulty',
        GAME_STATS: 'gameStats',
        MOVE_HISTORY: 'moveHistory',
    },

    SCENES: {
        LOGIN: 'Login',
        BATTLE: 'Battle',
        SETTING: 'Setting',
    },

    REPLAY: {
        SPEED: {
            SLOW: 2000,
            NORMAL: 1000,
            FAST: 500,
            VERY_FAST: 250,
        },
        DEFAULT_SPEED: 1000,
        MODE: {
            PLAYING: 'playing',
            PAUSED: 'paused',
            STOPPED: 'stopped',
        },
    },
};

export default GameConfig;