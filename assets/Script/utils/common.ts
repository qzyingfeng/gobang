/**
 * 通用工具函数
 */

export default {
    /**
     * 延迟执行
     * @param ms 延迟毫秒数
     */
    delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 格式化时间（秒转换为 mm:ss）
     * @param seconds 秒数
     */
    formatTime(seconds: number): string {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    },

    /**
     * 深度克隆对象
     * @param obj 需要克隆的对象
     */
    deepClone<T>(obj: T): T {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (obj instanceof Date) {
            return new Date(obj.getTime()) as any;
        }
        if (obj instanceof Array) {
            const cloneArr: any[] = [];
            for (let i = 0; i < obj.length; i++) {
                cloneArr[i] = this.deepClone(obj[i]);
            }
            return cloneArr as any;
        }
        if (obj instanceof Object) {
            const cloneObj: any = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloneObj[key] = this.deepClone(obj[key]);
                }
            }
            return cloneObj;
        }
        return obj;
    },

    /**
     * 随机获取数组中的一个元素
     * @param arr 数组
     */
    randomItem<T>(arr: T[]): T | undefined {
        if (!arr || arr.length === 0) return undefined;
        return arr[Math.floor(Math.random() * arr.length)];
    },

    /**
     * 随机整数范围
     * @param min 最小值
     * @param max 最大值
     */
    randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * 检查数组是否包含某元素
     * @param arr 数组
     * @param item 元素
     */
    contains<T>(arr: T[], item: T): boolean {
        return arr.indexOf(item) !== -1;
    },

    /**
     * 移除数组中的指定元素
     * @param arr 数组
     * @param item 要移除的元素
     */
    removeItem<T>(arr: T[], item: T): void {
        const index = arr.indexOf(item);
        if (index !== -1) {
            arr.splice(index, 1);
        }
    },

    /**
     * 安全获取对象属性
     * @param obj 对象
     * @param path 属性路径，如 'a.b.c'
     * @param defaultValue 默认值
     */
    get<T>(obj: any, path: string, defaultValue?: T): T | undefined {
        const keys = path.split('.');
        let result = obj;
        for (const key of keys) {
            if (result == null) {
                return defaultValue;
            }
            result = result[key];
        }
        return result !== undefined ? result : defaultValue;
    },

    /**
     * 判断是否为手机号
     * @param phone 手机号
     */
    isPhone(phone: string): boolean {
        return /^1[3-9]\d{9}$/.test(phone);
    },

    /**
     * 数字补零
     * @param num 数字
     * @param length 最小位数
     */
    padZero(num: number, length: number = 2): string {
        return num.toString().padStart(length, '0');
    },

    /**
     * 截断字符串
     * @param str 字符串
     * @param maxLength 最大长度
     * @param suffix 后缀
     */
    truncate(str: string, maxLength: number, suffix: string = '...'): string {
        if (str.length <= maxLength) return str;
        return str.substring(0, maxLength - suffix.length) + suffix;
    },

    /**
     * 数字格式化（千分位）
     * @param num 数字
     */
    formatNumber(num: number): string {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
};