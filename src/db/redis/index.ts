import redisClient, { Redis } from 'ioredis'
import { Rcf } from '../../../app.config'
declare global {
  //数据库对象
  var redis: Redis
}
const redis = new redisClient({ ...Rcf })
global.redis = redis
export const ctreateRedis = async () => {
  redis.on('error', error => {
    console.error('[REDIS]', error)
    process.exit()
  })
}
