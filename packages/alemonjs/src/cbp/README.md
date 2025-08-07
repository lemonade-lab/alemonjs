# CBP

```ts
/**
 * CBP: Chatbot Protocol
 * @description 聊天机器人协议
 *
 *              转发&格式化               格式化                   原始
 * AL Client  <--------- CBP(server) <--------- AL Platform  <--------- Platform(server)
 *            --------->             --------->              --------->
 *               行为                    转发&行为                行为API
 *               请求                    转发&请求                请求API
 *
 * CBP server 只允许 AL Platform 存在一个连接。允许 多个 AL Client 连接。
 * AL Client 默认全量接收消息。也可以进行进入分流模式
 * 接口： /api/online 服务是否在线
 */
```

```ts
/**
 * /testone
 *
 *              格式化event
 * CBP(server) <--------- AL Platform ()
 *             --------->
 *                行为
 *                请求
 *                配置
 *
 * 平台直连CBP/testone，
 * 1. 可以直接发送格式化好的event，
 * 2. 可以获取指定的个性化配置信息，
 *
 */
```
