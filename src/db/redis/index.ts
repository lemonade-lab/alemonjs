import Redis from 'ioredis';
import { red } from 'kolorist';
declare global {
  var redis: any
}
export const redisInit = async () => {
  const redis = new Redis({
    host: '127.0.0.1',
    port: 6379,
  });
  redis.on('error', (error) => {
    console.log(red('[REDIS]'), error);
    process.exit()
  });
  global.redis = redis
}