/**
 * TimeManager - 时间管理器
 * 处理时间戳与日期格式转换
 * 单例模式
 */

class TimeManagerClass {
    /** 单例实例 */
    private static _instance: TimeManagerClass | null = null;
    /** 本地时区偏移（毫秒） */
    private timezoneOffset: number = new Date().getTimezoneOffset() * 60 * 1000;

    constructor() {}

    /**
     * 获取单例实例
     */
    static getInstance(): TimeManagerClass {
        if (!this._instance) {
            this._instance = new TimeManagerClass();
        }
        return this._instance;
    }

    /**
     * 获取当前时间戳（秒）
     */
    getCurrentTimestamp(): number {
        return Math.floor(Date.now() / 1000);
    }

    /**
     * 获取当前时间戳（毫秒）
     */
    getCurrentTimestampMs(): number {
        return Date.now();
    }

    /**
     * 时间戳转 Date 对象
     * @param timestamp 秒级时间戳
     */
    timestampToDate(timestamp: number): Date {
        return new Date(timestamp * 1000);
    }

    /**
     * 格式化时间戳为年月日时分秒
     * @param timestamp 秒级时间戳
     * @param separator 分隔符，默认 '-'
     * @param showTime 是否显示时分秒，默认 true
     * @returns 格式：YYYY-MM-DD HH:mm:ss
     */
    formatTimestamp(timestamp: number, separator: string = '-', showTime: boolean = true): string {
        const date = this.timestampToDate(timestamp);
        const year = date.getFullYear();
        const month = this.padZero(date.getMonth() + 1);
        const day = this.padZero(date.getDate());

        if (!showTime) {
            return `${year}${separator}${month}${separator}${day}`;
        }

        const hour = this.padZero(date.getHours());
        const minute = this.padZero(date.getMinutes());
        const second = this.padZero(date.getSeconds());

        return `${year}${separator}${month}${separator}${day} ${hour}:${minute}:${second}`;
    }

    /**
     * 格式化时间戳为年月日
     * @param timestamp 秒级时间戳
     * @param separator 分隔符，默认 '-'
     */
    formatDate(timestamp: number, separator: string = '-'): string {
        return this.formatTimestamp(timestamp, separator, false);
    }

    /**
     * 格式化时间戳为时分秒
     * @param timestamp 秒级时间戳
     */
    formatTime(timestamp: number): string {
        const date = this.timestampToDate(timestamp);
        const hour = this.padZero(date.getHours());
        const minute = this.padZero(date.getMinutes());
        const second = this.padZero(date.getSeconds());
        return `${hour}:${minute}:${second}`;
    }

    /**
     * 格式化时间戳为中文日期
     * @param timestamp 秒级时间戳
     * @returns 格式：YYYY年MM月DD日
     */
    formatChineseDate(timestamp: number): string {
        const date = this.timestampToDate(timestamp);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}年${month}月${day}日`;
    }

    /**
     * 格式化时间戳为中文日期时间
     * @param timestamp 秒级时间戳
     * @returns 格式：YYYY年MM月DD日 HH:mm:ss
     */
    formatChineseDateTime(timestamp: number): string {
        const date = this.timestampToDate(timestamp);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hour = this.padZero(date.getHours());
        const minute = this.padZero(date.getMinutes());
        const second = this.padZero(date.getSeconds());
        return `${year}年${month}月${day}日 ${hour}:${minute}:${second}`;
    }

    /**
     * 获取时间戳的年份
     */
    getYear(timestamp: number): number {
        return this.timestampToDate(timestamp).getFullYear();
    }

    /**
     * 获取时间戳的月份（1-12）
     */
    getMonth(timestamp: number): number {
        return this.timestampToDate(timestamp).getMonth() + 1;
    }

    /**
     * 获取时间戳的日期
     */
    getDay(timestamp: number): number {
        return this.timestampToDate(timestamp).getDate();
    }

    /**
     * 获取时间戳的小时
     */
    getHour(timestamp: number): number {
        return this.timestampToDate(timestamp).getHours();
    }

    /**
     * 获取时间戳的分钟
     */
    getMinute(timestamp: number): number {
        return this.timestampToDate(timestamp).getMinutes();
    }

    /**
     * 获取时间戳的秒数
     */
    getSecond(timestamp: number): number {
        return this.timestampToDate(timestamp).getSeconds();
    }

    /**
     * 获取时间戳是星期几（0-6，0为周日）
     */
    getWeekday(timestamp: number): number {
        return this.timestampToDate(timestamp).getDay();
    }

    /**
     * 获取时间戳的中文星期
     */
    getChineseWeekday(timestamp: number): string {
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return weekdays[this.getWeekday(timestamp)];
    }

    /**
     * 计算两个时间戳的差值（秒）
     */
    getDiff(timestamp1: number, timestamp2: number): number {
        return Math.abs(timestamp1 - timestamp2);
    }

    /**
     * 判断是否为同一天
     */
    isSameDay(timestamp1: number, timestamp2: number): boolean {
        const date1 = this.timestampToDate(timestamp1);
        const date2 = this.timestampToDate(timestamp2);
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    /**
     * 判断时间戳是否为今天
     */
    isToday(timestamp: number): boolean {
        return this.isSameDay(timestamp, this.getCurrentTimestamp());
    }

    /**
     * 数字补零
     */
    private padZero(num: number): string {
        return num < 10 ? `0${num}` : `${num}`;
    }

    /**
     * 将 Date 对象转换为时间戳（秒）
     */
    dateToTimestamp(date: Date): number {
        return Math.floor(date.getTime() / 1000);
    }

    /**
     * 将年月日转换为时间戳
     * @param year 年
     * @param month 月（1-12）
     * @param day 日
     * @param hour 时
     * @param minute 分
     * @param second 秒
     */
    ymdToTimestamp(year: number, month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0): number {
        const date = new Date(year, month - 1, day, hour, minute, second);
        return this.dateToTimestamp(date);
    }

    /**
     * 获取指定时间戳所在天的开始时间戳
     */
    getDayStart(timestamp: number): number {
        const date = this.timestampToDate(timestamp);
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return this.dateToTimestamp(start);
    }

    /**
     * 获取指定时间戳所在天的结束时间戳
     */
    getDayEnd(timestamp: number): number {
        const date = this.timestampToDate(timestamp);
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
        return this.dateToTimestamp(end);
    }
}

export default TimeManagerClass;