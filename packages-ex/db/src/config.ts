import { getConfigValue } from 'alemonjs';

/**
 * 获取 db 配置（新格式）
 */
export const getDbConfig = () => {
  const value = getConfigValue() || {};

  return value?.db || {};
};

/**
 * 获取配置的 dialect
 */
export const getDialect = (): string | undefined => {
  return getDbConfig()?.dialect;
};

/**
 * 获取 MySQL 配置，优先读取 db.mysql，回退到顶层 mysql
 */
export const getMysqlConfig = () => {
  const value = getConfigValue() || {};

  return value?.db?.mysql || value?.mysql || {};
};

/**
 * 获取 Redis 配置，优先读取 db.redis，回退到顶层 redis
 */
export const getRedisConfig = () => {
  const value = getConfigValue() || {};

  return value?.db?.redis || value?.redis || {};
};

/**
 * 获取 SQLite 配置，优先读取 db.sqlite，回退到顶层 sqlite
 */
export const getSqliteConfig = () => {
  const value = getConfigValue() || {};

  return value?.db?.sqlite || value?.sqlite || {};
};

/**
 * 获取 Mongo 配置，优先读取 db.mongo，回退到顶层 mongo
 */
export const getMongoConfig = () => {
  const value = getConfigValue() || {};

  return value?.db?.mongo || value?.mongo || {};
};
