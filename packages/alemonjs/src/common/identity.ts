import { getConfigValue } from './config.js';

export const matchIn = (source: any, key: string): boolean => {
  if (Array.isArray(source)) {
    return source.includes(key);
  }
  if (source && typeof source === 'object') {
    return Object.prototype.hasOwnProperty.call(source, key) && !!source[key];
  }

  return false;
};

export const fastHash = (str: string): string => {
  let hash = 0x811c9dc5;

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(36);
};

export const createUserHashKey = (event: { UserId: string; Platform: string }) => {
  return fastHash(`${event.Platform}:${event.UserId}`);
};

/**
 * @deprecated 已废弃，请直接使用 useUserHashKey
 */
export const useUserHashKey = createUserHashKey;

export const isMaster = (UserId: string, platform: string): boolean => {
  const values = getConfigValue() || {};
  const value = values[platform] && typeof values[platform] === 'object' ? values[platform] : {};
  const UserKey = createUserHashKey({
    Platform: platform,
    UserId
  });

  return matchIn(values.master_key, UserKey) || matchIn(values.master_id, UserId) || matchIn(value.master_key, UserKey) || matchIn(value.master_id, UserId);
};
