import redisClient, { Redis as RedisClient } from 'ioredis'
import { getConfig } from '../config'
const createIoRedis = () => {
  const cfg = getConfig()
  const aRedis = new redisClient({
    host: cfg.redis.host ?? 'localhost',
    port: cfg.redis.port ?? 6379,
    password: cfg.redis.password ?? '',
    db: cfg.redis.db ?? 0,
    maxRetriesPerRequest: null
  })
  aRedis.on('error', (err: any) => {
    console.error('\n[REDIS]', err)
    console.error('\n[REDIS]', '请检查配置')
    process.cwd()
  })
  return aRedis
}

/**
 *
 * @returns
 */
export const getIoRedis = (): RedisClient => {
  if (!global.ioRedis) global.ioRedis = createIoRedis()
  return global.ioRedis
}
