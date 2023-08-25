import redisClient from "ioredis";
import { join } from "path";
import { getYaml } from "./config.js";
import { ioRedisConfigType } from "./types.js";

export const ioRedisConfig: ioRedisConfigType = {
  host: "127.0.0.1",
  port: 6379,
  password: "",
  db: 1,
};

export function createRedis(
  cfg: string | ioRedisConfigType = "config/redis.yaml"
) {
  try {
    if (typeof cfg === "string") {
      let redis_config;
      try {
        redis_config = getYaml(join(process.cwd(), cfg));
      } catch (error) {
        redis_config = ioRedisConfig;
      }
      if (!redis_config) {
        redis_config = ioRedisConfig;
      }
      const ALRedis = new redisClient(redis_config);
      ALRedis.on("error", (error) => {
        console.error("\n[REDIS]", error);
        console.error("\n[REDIS]", "请检查app配置~");
      });
      return ALRedis;
    }
    if (typeof cfg === "object" && cfg !== null) {
      // 如果配置cfg中没有 host  port 和 password  字段则使用
      const ALRedis = new redisClient(cfg);
      ALRedis.on("error", (error) => {
        console.error("\n[REDIS]", error);
        console.error("\n[REDIS]", "请检查app配置~");
      });
      return ALRedis;
    } else {
      console.error("\n[REDIS]", "请检查app配置~");
    }
  } catch (err) {
    console.log(err);
  }
}

export * from "ioredis";
