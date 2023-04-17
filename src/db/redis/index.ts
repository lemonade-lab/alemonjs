import Redis from 'ioredis'
import { red } from 'kolorist'
import { Rcf } from '../../config'
declare global {
  var redis: any
}
export const redisInit = async () => {
  const redis = new Redis({ ...Rcf })
  /**
   * 兼容连接错误事件
   */
  redis.on('error', error => {
    console.log(red('[REDIS]'), error)
    process.exit()
  })
  global.redis = redis
}
