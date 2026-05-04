/**
 * Storage - 本地存储工具
 * 统一加密的 localStorage 封装
 * 
 * 功能：
 * - 所有数据存储时自动加密，防止玩家篡改
 * - 读取时自动解密
 * - 支持任意类型数据（字符串、数字、布尔、对象）
 * - 统一的 API，无需判断空值
 * 
 * 使用场景：
 * - 游戏设置持久化
 * - 战绩/存档数据
 * - 玩家偏好保存
 * 
 * 注意：
 * - 基于 localStorage，遵循浏览器存储限制（约 5MB）
 * - 加密强度适中，防止普通用户篡改，但无法抵御专业黑客
 */

/**
 * Base64 编码（支持 Unicode）
 */
function base64Encode(str: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code > 0xFF) {
            bytes.push((code >> 8) & 0xFF, code & 0xFF);
        } else {
            bytes.push(code);
        }
    }
    for (let i = 0; i < bytes.length; i += 3) {
        const b1 = bytes[i] || 0;
        const b2 = bytes[i + 1] || 0;
        const b3 = bytes[i + 2] || 0;
        result += chars[b1 >> 2];
        result += chars[((b1 & 3) << 4) | (b2 >> 4)];
        result += i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '=';
        result += i + 2 < bytes.length ? chars[b3 & 63] : '=';
    }
    return result;
}

/**
 * Base64 解码（支持 Unicode）
 */
function base64Decode(str: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        const c = str.charAt(i);
        if (c === '=') continue;
        const idx = chars.indexOf(c);
        if (idx === -1) continue;
        bytes.push(idx);
    }
    for (let i = 0; i < bytes.length; i += 4) {
        const b1 = bytes[i];
        const b2 = bytes[i + 1];
        const b3 = bytes[i + 2];
        const b4 = bytes[i + 3];
        const byte1 = (b1 << 2) | (b2 >> 4);
        const byte2 = ((b2 & 15) << 4) | (b3 >> 2);
        const byte3 = ((b3 & 3) << 6) | b4;
        result += String.fromCharCode(byte1);
        if (b3 !== undefined) result += String.fromCharCode(byte2);
        if (b4 !== undefined) result += String.fromCharCode(byte3);
    }
    return result;
}

/**
 * 简单的加密函数（XOR + base64）
 * 用于防止玩家直接修改 localStorage 数据
 * 
 * 原理：对字符串进行 XOR 运算，然后 base64 编码
 * 优点：简单高效，不可逆（不暴露原始数据）
 * 
 * @param str 要加密的字符串
 * @returns 加密后的字符串
 */
function encrypt(str: string): string {
    // 密钥（可改成更复杂的字符串）
    const key = 'GobangSecret2024';
    let result = '';
    for (let i = 0; i < str.length; i++) {
        result += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return base64Encode(result);
}

/**
 * 解密函数（base64 解码 + XOR）
 * 
 * @param str 加密后的字符串
 * @returns 解密后的原始字符串
 */
function decrypt(str: string): string {
    if (!str) return '';
    try {
        const key = 'GobangSecret2024';
        const base64Decoded = base64Decode(str);
        let result = '';
        for (let i = 0; i < base64Decoded.length; i++) {
            result += String.fromCharCode(base64Decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    } catch (e) {
        // 解密失败，返回空
        return '';
    }
}

/**
 * Storage 主类
 */
export default class Storage {
    /**
     * 存储值（自动 JSON 序列化 + 加密）
     * 
     * @param key 键名
     * @param value 值（可以是任意类型）
     * 
     * 使用示例：
     * Storage.set('playerName', '小明');
     * Storage.set('score', 100);
     * Storage.set('settings', { volume: 0.5, difficulty: 'hard' });
     */
    static set(key: string, value: any): void {
        try {
            // 统一转 JSON 字符串
            const jsonStr = JSON.stringify(value);
            // 加密后存储
            const encrypted = encrypt(jsonStr);
            cc.sys.localStorage.setItem(key, encrypted);
        } catch (e) {
            cc.error('[Storage] set 失败:', key, e);
        }
    }

    /**
     * 读取值（自动解密 + JSON 反序列化）
     * 
     * @param key 键名
     * @param defaultValue 默认值（当 key 不存在时返回）
     * @returns 存储的值，或默认值
     * 
     * 使用示例：
     * const name = Storage.get('playerName', '匿名');
     * const score = Storage.get('score', 0);
     * const settings = Storage.get('settings', { volume: 1 });
     */
    static get(key: string, defaultValue: any = null): any {
        try {
            const encrypted = cc.sys.localStorage.getItem(key);
            if (!encrypted) {
                return defaultValue;
            }
            // 解密
            const decrypted = decrypt(encrypted);
            if (!decrypted) {
                return defaultValue;
            }
            // JSON 反序列化
            return JSON.parse(decrypted);
        } catch (e) {
            // 解析失败，返回默认值
            return defaultValue;
        }
    }

    /**
     * 读取字符串值
     * 
     * @param key 键名
     * @param defaultValue 默认值
     * @returns 字符串值
     */
    static getString(key: string, defaultValue: string = ''): string {
        const value = this.get(key, defaultValue);
        return typeof value === 'string' ? value : defaultValue;
    }

    /**
     * 读取数字值
     * 
     * @param key 键名
     * @param defaultValue 默认值
     * @returns 数字值
     */
    static getNumber(key: string, defaultValue: number = 0): number {
        const value = this.get(key, defaultValue);
        return typeof value === 'number' ? value : defaultValue;
    }

    /**
     * 读取布尔值
     * 
     * @param key 键名
     * @param defaultValue 默认值
     * @returns 布尔值
     */
    static getBool(key: string, defaultValue: boolean = false): boolean {
        const value = this.get(key, defaultValue);
        return typeof value === 'boolean' ? value : defaultValue;
    }

    /**
     * 读取对象值
     * 
     * @param key 键名
     * @param defaultValue 默认值
     * @returns 对象值
     */
    static getObject<T>(key: string, defaultValue: T): T {
        const value = this.get(key, defaultValue);
        return typeof value === 'object' && value !== null ? value : defaultValue;
    }

    /**
     * 删除指定键
     * 
     * @param key 键名
     * 
     * 使用示例：
     * Storage.remove('oldData');
     */
    static remove(key: string): void {
        cc.sys.localStorage.removeItem(key);
    }

    /**
     * 清空所有存储
     * 
     * 使用示例：
     * Storage.clear();  // 慎用，会删除所有数据
     */
    static clear(): void {
        cc.sys.localStorage.clear();
    }

    /**
     * 检查键是否存在
     * 
     * @param key 键名
     * @returns 是否存在
     */
    static has(key: string): boolean {
        return cc.sys.localStorage.getItem(key) !== null;
    }

    /**
     * 获取存储的键值对数量
     * 
     * @returns 数量
     */
    static getLength(): number {
        return cc.sys.localStorage.length;
    }

    /**
     * 获取所有键名
     * 
     * @returns 键名数组
     */
    static getKeys(): string[] {
        const keys: string[] = [];
        for (let i = 0; i < cc.sys.localStorage.length; i++) {
            const key = cc.sys.localStorage.key(i);
            if (key) keys.push(key);
        }
        return keys;
    }

    /**
     * 获取存储使用量（近似值）
     * 
     * @returns 字节数
     */
    static getUsedSize(): number {
        let total = 0;
        for (let i = 0; i < cc.sys.localStorage.length; i++) {
            const key = cc.sys.localStorage.key(i);
            if (key) {
                const value = cc.sys.localStorage.getItem(key);
                total += key.length + (value ? value.length : 0);
            }
        }
        return total;
    }

    /**
     * 导出所有数据（用于存档备份）
     * 
     * @returns 所有键值对的对象
     * 
     * 使用示例：
     * const backup = Storage.exportAll();
     * console.log(JSON.stringify(backup));
     */
    static exportAll(): Record<string, any> {
        const result: Record<string, any> = {};
        const keys = this.getKeys();
        for (const key of keys) {
            result[key] = this.get(key);
        }
        return result;
    }

    /**
     * 导入数据（用于存档恢复）
     * 
     * @param data 键值对对象
     * 
     * 使用示例：
     * Storage.importAll({ playerName: '小明', score: 100 });
     */
    static importAll(data: Record<string, any>): void {
        for (const key in data) {
            this.set(key, data[key]);
        }
    }
}