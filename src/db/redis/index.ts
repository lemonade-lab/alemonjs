import redisClient, { Redis } from 'ioredis'
import { Rcf } from '../../../app.config'
declare global {
  //数据库对象
  var redis: Redis
}
export const redisInit = async () => {
  const ctreateRedis = async () => {
    /** 实例化redis */
    const redis = new redisClient({ ...Rcf })
    /**  兼容连接错误事件 */
    redis.on('error', error => {
      console.error('[REDIS]', error)
      process.exit()
    })
    /** 全局 */
    global.redis = redis
  }
  await ctreateRedis()
    .then(() => {
      console.info('[REIDS] 连接成功~')
    })
    .catch(err => {
      console.info('[REIDS] 连接失败!')
      console.error(err)
    })

  return
}
