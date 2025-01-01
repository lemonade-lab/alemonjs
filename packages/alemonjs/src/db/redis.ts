/**
 * @fileoverview 关系型数据库处理模块
 * 获得ioredis时，自动链接
 * @module ioredis
 * @author ningmengchongshui
 */
import redisClient, { Redis as RedisClient } from 'ioredis'
import { getConfigValue } from '../config'

/**
 * 创建ioredis
 * @returns
 */
const createIoRedis = () => {
  const value = getConfigValue()
  const aRedis = new redisClient({
    host: value.redis.host ?? 'localhost',
    port: value.redis.port ?? 6379,
    password: value.redis.password ?? '',
    db: value.redis.db ?? 0,
    maxRetriesPerRequest: null
  })
  return aRedis
}

/**
 * 获得ioredis客户端
 * @returns
 */
export const getIoRedis = (): RedisClient => {
  if (!global.ioRedis) global.ioRedis = createIoRedis()
  return global.ioRedis
}
