import redisClient from "ioredis";
import { join } from "path";
import { getYaml } from "./config.js";
const ConfigRedis = "config/redis.yaml";
const RCfg = getYaml(join(process.cwd(), ConfigRedis));
const ALRedis = new redisClient(RCfg);
ALRedis.on("error", (error) => {
  console.error("\n[REDIS]", error);
  console.error("\n[REDIS]", "请检查app配置~");
  process.exit();
});
export * from "ioredis";
export { ALRedis };
