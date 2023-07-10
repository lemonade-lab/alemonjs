import redisClient from "ioredis";
import { join } from "path";
import { getYaml } from "./config.js";
export * from "ioredis";
export function createRedis(cfg = "config/redis.yaml") {
  try {
    if (typeof cfg === "string") {
      const redis_config = getYaml(join(process.cwd(), cfg));
      const ALRedis = new redisClient(redis_config);
      ALRedis.on("error", (error) => {
        console.error("\n[REDIS]", error);
        console.error("\n[REDIS]", "请检查app配置~");
      });
      return ALRedis;
    } else {
      const ALRedis = new redisClient(cfg);
      ALRedis.on("error", (error) => {
        console.error("\n[REDIS]", error);
        console.error("\n[REDIS]", "请检查app配置~");
      });
      return ALRedis;
    }
  } catch (err) {
    console.log(err);
  }
}
