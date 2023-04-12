import { green } from 'kolorist'
declare global {
  var redis: any
}
export const redisInit = async () => {
  const redis = await import('redis')
  const client = redis.createClient()
  client
    .connect()
    .then(() => {
      console.log(green('[REDIS] OK'))
    })
    .catch(console.error)
  global.redis = client
}
