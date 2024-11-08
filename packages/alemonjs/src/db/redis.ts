/**
 * @fileoverview 关系型数据库处理模块
 * 获得ioredis时，自动链接
 * @module ioredis
 * @author ningmengchongshui
 */
import redisClient, { Redis as RedisClient } from 'ioredis'
import { getConfig } from '../config'

/**
 * 创建ioredis
 * @returns
 */
const createIoRedis = () => {
  const cfg = getConfig()
  const aRedis = new redisClient({
    host: cfg.value.redis.host ?? 'localhost',
    port: cfg.value.redis.port ?? 6379,
    password: cfg.value.redis.password ?? '',
    db: cfg.value.redis.db ?? 0,
    maxRetriesPerRequest: null
  })
  aRedis.on('error', (err: any) => {
    logger.error('\n[REDIS]', err)
    logger.error('\n[REDIS]', '请检查配置')
    process.cwd()
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
