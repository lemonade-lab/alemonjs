import redisClient, { RedisOptions } from "ioredis";
import { ioRedisOptions, getToml } from "./config.js";

export const dcfg: ioRedisOptions = {
  host: "127.0.0.1",
  port: 6379,
  password: "",
  db: 1,
};

/**
 * 创建redis应用
 * @param cfg 
 * @returns 
 */
export function createRedis(cfg?: RedisOptions | string) {
  try {
    // 存在参数
    if (cfg) {
      // 读取默认配置文件
      let val = dcfg
      if (typeof cfg == 'string') {
        // 是字符串
        const data = getToml(cfg)
        // 读取成功
        if (data && data?.redis) {
          val = data.redis
        }
      }
      const ALRedis = new redisClient(val);
      ALRedis.on("error", (err: any) => {
        console.error("\n[REDIS]", err);
        console.error("\n[REDIS]", "请检查配置");
      });
      return ALRedis
    }
    // 不存在参数
    if (!cfg) {
      // 读取默认配置文件
      let val = dcfg
      const data = getToml()
      // 默认配置文件存在redis
      if (data && data?.redis) {
        // 存在redis配置,直接使用
        val = data.redis
        // 输入了配置信息
        const ALRedis = new redisClient(val);
        ALRedis.on("error", (err: any) => {
          console.error("\n[REDIS]", err);
          console.error("\n[REDIS]", "请检查配置");
        });
        return ALRedis
      }
      // 不存在 redis
      const ALRedis = new redisClient(dcfg);
      ALRedis.on("error", (err: any) => {
        console.error("\n[REDIS]", err);
        console.error("\n[REDIS]", "请检查配置");
      });
      return ALRedis;
    }
  } catch (err) {
    console.log(err);
    console.error("\n[REDIS]", "请检查配置");
  }
}

/**
 * 创建可配置应用
 * @param url 文件地址
 * @param options 附加参数
 * @returns 
 */
export async function createRedisByOptions(
  url: string,
  options: RedisOptions = {}) {
  try {
    let val = dcfg
    const data = getToml(url)
    if (data && data?.redis) {
      val = data.redis
    }
    const ALRedis = new redisClient({
      ...val,
      ...options
    });
    ALRedis.on("error", (err: any) => {
      console.error("\n[REDIS]", err);
      console.error("\n[REDIS]", "请检查配置");
    });
    return ALRedis
  } catch (err) {
    console.log(err);
    console.error("\n[REDIS]", "请检查配置");
  }
}