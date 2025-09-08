/**
 * @fileoverview 关系型数据库处理模块
 * 获得ioredis时，自动链接
 * @module ioredis
 * @author ningmengchongshui
 */
import redisClient, { Redis as RedisClient, RedisOptions } from 'ioredis';
import { getRedisConfig } from '../config';

type Config = {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
};

/**
 * 获得ioredis客户端
 * @returns
 */
export const getIoRedis = (config: Config & RedisOptions = {}): RedisClient => {
  if (global.ioRedis) {
    return global.ioRedis;
  }
  const redis = getRedisConfig();
  const { host, port, password, db, ...options } = config;
  const baseConfig = {
    host: '127.0.0.1',
    port: 6379,
    password: '',
    db: 0
  };
  const connectConfig = {
    host: host || redis?.host || baseConfig.host,
    port: port || redis?.port || baseConfig.port,
    password: password || redis?.password || baseConfig.password,
    db: db || redis?.db || baseConfig.db
  };

  global.ioRedis = new redisClient({
    host: connectConfig.host,
    port: connectConfig.port,
    password: connectConfig.password,
    db: connectConfig.db,
    maxRetriesPerRequest: null,
    ...options
  });

  return global.ioRedis;
};
