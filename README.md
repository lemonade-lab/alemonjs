# redis 链接

安装

```shell
npm install alemon-redis
```

使用示例

```ts
import { createRedis } from "alemon-redis";
// 不传入配置地址,默认读取config/redis.yaml
const redisA = reateReids();
// 传入配置地址
const redisB = createRedis("config/my/redis.yaml");
// 传入参数
const redisC = createRedis({
  host: "127.0.0.1",
  port: 6379,
  password: "",
  db: 1,
});
// 实例可以创建多个,默认使用数据库1
```
