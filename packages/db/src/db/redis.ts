/**
 * @fileoverview 关系型数据库处理模块
 * 获得ioredis时，自动链接
 * @module ioredis
 * @author ningmengchongshui
 */
import redisClient, { Redis as RedisClient } from 'ioredis'
import { getConfigValue } from 'alemonjs'

type Config = {
  host?: string
  port?: number
  password?: string
  db?: number
}

/**
 * 获得ioredis客户端
 * @returns
 */
export const getIoRedis = (config: Config = {}): RedisClient => {
  if (global.ioRedis) return global.ioRedis
  const value = getConfigValue() || {}
  const redis = value?.redis || {}
  const { host, port, password, db } = config
  const connectConfig = {
    host: host || redis?.host || '127.0.1',
    port: port || redis?.port || 6379,
    password: password || redis?.password || '',
    db: db || redis?.db || 0
  }
  global.ioRedis = new redisClient({
    host: connectConfig.host,
    port: connectConfig.port,
    password: connectConfig.password,
    db: connectConfig.db,
    maxRetriesPerRequest: null
  })
  return global.ioRedis
}
