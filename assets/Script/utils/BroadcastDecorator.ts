/**
 * 广播方法装饰器
 * 标记方法为"可被全局广播调用"
 * 使用方式：在组件的方法前加 @Broadcast
 */
export function Broadcast(target: any, propertyKey: string): void {
    if (!target.constructor.__broadcastMethods) {
        target.constructor.__broadcastMethods = [];
    }
    if (!target.constructor.__broadcastMethods.includes(propertyKey)) {
        target.constructor.__broadcastMethods.push(propertyKey);
    }
}
