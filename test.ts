import { defaultsDeep } from 'lodash-es';

// 默认数据及类型
export const baseData = {
    version: 1,
    value: {
        action: '',
        payload: {
            ChannelId: '',
            UserId: '',
            params: { format: '' }
        }
    }
};
export type BaseData = typeof baseData;

/**
 * 更安全的解析，并且填充默认值
 */
export function parseWithDefaults<T>(jsonStr: string, defaults: T): T {
    let data = {};
    try {
        data = JSON.parse(jsonStr);
    } catch (e) {
        console.error('JSON 解析失败:', e);
        return defaults;
    }
    // 注意参数顺序，defaults 优先
    return defaultsDeep({}, defaults, data);
}

/**
 * 迁移数据到新版本
 */
export function migrate<T extends { version: number }>(
    jsonStr: string,
    defaults: T,
    callbacks: { [version: number]: (oldData: T) => T }
): T {
    const oldData = parseWithDefaults(jsonStr, defaults);
    const version = oldData.version ?? 0;

    if (version > defaults.version) {
        console.warn(`数据版本 (${version}) 高于当前版本 (${defaults.version})，请升级程序。`);
        return oldData;
    }

    let newData = oldData;
    for (let v = version + 1; v <= defaults.version; v++) {
        const callback = callbacks[v];
        if (callback) {
            newData = callback(newData);
            newData.version = v;
        } else {
            console.warn(`没有找到版本 ${v} 的迁移函数，跳过该版本。`);
        }
    }
    return newData;
}

// 读取数据
export const readData = (dataStr: string) => {
    return migrate(dataStr, baseData, {
        1: (oldData) => oldData // 例子：v1迁移
    }).value;
};