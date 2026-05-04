/**
 * 全局广播事件类型声明
 * 在此扩展所有业务事件类型
 */
declare global {
    interface BroadcastEvents {
        /** 游戏结束事件 */
        gameover: { reason: string; score?: number; isVictory?: boolean };
        /** 升级事件 */
        levelup: { newLevel: number; bonus?: string };
        // 在此扩展其他业务事件
    }
}

export {};
