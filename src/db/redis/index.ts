import redisClient, { Redis } from 'ioredis'
import { AppConfig } from '../../config'
declare global {
  //数据库对象
  var redis: Redis
}
const redis = new redisClient({ ...AppConfig.Rcf })
redis.on('error', error => {
  console.error('\n[REDIS]', error)
  process.exit()
})
global.redis = redis
