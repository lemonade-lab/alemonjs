# 钉钉 API 与框架对应

核对日期：2026-10-15。范围是 `@alicloud/dingtalk@2.2.48` 的 `robot_1_0` 机器人服务，29 个操作；不包含钉钉通讯录、审批、日历等其他服务。Stream 连接来自当前依赖 `dingtalk-stream@2.1.6-beta.1`。

## 调用方式与类型

包入口导出 `API`（`DingTalkClient`），包含 `stream`、`robot` 和 `request`。`robot` 下的具名方法接受一个原生参数对象，返回原生响应体；请求和响应字段类型在 [src/api.ts](src/api.ts) 中完整列出。使用框架 `useClient<API>(event)` 时，调用通过 `client.api` 协议转发，外层结果遵循框架 `Result[]`，不是直接返回 SDK 结果。独立调用 `createDriver(...).client.robot` 才直接返回响应体。

```ts
import { useClient } from 'alemonjs';
import type { API } from '@alemonjs/dingtalk';
const [client] = useClient<API>(event);
await client.robot.orgGroupRecall({
  robotCode: 'your-robot-code',
  openConversationId: 'your-conversation-id',
  processQueryKeys: ['the-original-send-receipt-key']
});
```

`request(path, body?, method = 'POST')` 保留兼容入口，只访问 `https://api.dingtalk.com/v1.0/`，支持 GET/POST/PUT 等方法。具名 API 为 GET 构造查询字符串，为其他方法发送 JSON；认证令牌由驱动获取和缓存。

## 原生接口清单

下表 29/29 均有具名方法、参数类型和响应类型。4/29 同时映射为框架动作，其余保持平台语义，通过具名 API 调用。这个比例只描述机器人服务接口映射，不表示框架功能完成率。

| `client.robot` 方法             | HTTP | 路径（相对 `/v1.0/`）                   | 框架对应                                                  |
| ------------------------------- | ---- | --------------------------------------- | --------------------------------------------------------- |
| `addOrgRobotInstanceToGroup`    | POST | `robot/groups/orgRobots/add`            | 原生 API；见下方边界                                      |
| `batchOTOQuery`                 | GET  | `robot/oToMessages/readStatus`          | 原生 API；见下方边界                                      |
| `batchRecallGroup`              | POST | `robot/groupMessages/batchRecall`       | 原生 API；见下方边界                                      |
| `batchRecallOTO`                | POST | `robot/otoMessages/batchRecall`         | 原生 API；见下方边界                                      |
| `batchRecallPrivateChat`        | POST | `robot/privateChatMessages/batchRecall` | 原生 API；见下方边界                                      |
| `batchSendOTO`                  | POST | `robot/oToMessages/batchSend`           | message.send.user / message.send / message.send.target    |
| `clearRobotPlugin`              | POST | `robot/plugins/clear`                   | 原生 API；见下方边界                                      |
| `deleteCustomRobot`             | POST | `robot/custom/delete`                   | 原生 API；见下方边界                                      |
| `executeRobotAiSkill`           | POST | `robot/aiSkill/execute`                 | 原生 API；见下方边界                                      |
| `getBotListInGroup`             | POST | `robot/groups/robots/query`             | 原生 API；见下方边界                                      |
| `manageSingleChatRobotStatus`   | POST | `robot/statuses/manage`                 | 原生 API；见下方边界                                      |
| `orgGroupQuery`                 | POST | `robot/groupMessages/query`             | 原生 API；见下方边界                                      |
| `orgGroupRecall`                | POST | `robot/groupMessages/recall`            | 原生 API；见下方边界                                      |
| `orgGroupSend`                  | POST | `robot/groupMessages/send`              | message.send.channel / message.send / message.send.target |
| `privateChatQuery`              | POST | `robot/privateChatMessages/query`       | 原生 API；见下方边界                                      |
| `privateChatSend`               | POST | `robot/privateChatMessages/send`        | 原生 API；见下方边界                                      |
| `queryBotInstanceInGroupInfo`   | POST | `robot/groups/query`                    | 原生 API；见下方边界                                      |
| `queryRobotDingReadStatus`      | POST | `robot/ding/readStatuses/query`         | 原生 API；见下方边界                                      |
| `queryRobotInstanceInGroupInfo` | POST | `robot/installed/groups/query`          | 原生 API；见下方边界                                      |
| `queryRobotPlugin`              | POST | `robot/plugins/query`                   | 原生 API；见下方边界                                      |
| `robotMessageFileDownload`      | POST | `robot/messageFiles/download`           | 原生 API；见下方边界                                      |
| `robotRecallDing`               | POST | `robot/ding/recall`                     | 原生 API；见下方边界                                      |
| `robotRecallEmotion`            | POST | `robot/emotion/recall`                  | reaction.remove                                           |
| `robotReplyEmotion`             | POST | `robot/emotion/reply`                   | reaction.add                                              |
| `robotSendDing`                 | POST | `robot/ding/send`                       | 原生 API；见下方边界                                      |
| `sendRobotDingMessage`          | POST | `robot/dingMessages/send`               | 原生 API；见下方边界                                      |
| `setRobotPlugin`                | POST | `robot/plugins/set`                     | 原生 API；见下方边界                                      |
| `updateCustomRobotOutgoing`     | POST | `robot/custom/outgoing/update`          | 原生 API；见下方边界                                      |
| `updateInstalledRobot`          | PUT  | `robot/managements/infos`               | 原生 API；见下方边界                                      |

## 框架映射与边界

- 发送：4 个 `message.send*` 入口使用文本发送，回复原会话优先使用未过期 Webhook；主动私聊使用员工身份，群聊使用 openConversationId。复杂消息的 msgKey/msgParam 可通过 `robot.batchSendOTO` / `robot.orgGroupSend` 发送。
- 表情：`reaction.add/remove` 使用 ChannelId → openConversationId、MessageId → openMsgId、EmojiId → emotionName；平台返回 success=false 时明确失败。
- 撤回：原生 API 需要发送回执 processQueryKey。框架 message.delete 接收 MessageId，二者不等价，因此保持具名 recall API，不注册错误映射。
- 查询：已读状态接口不是消息正文获取；机器人所在群列表/群内机器人列表不是完整频道/成员查询。不将它们映射成 message.get、history.list 或 member.list。
- 原生专有能力：DING、机器人管理、快捷入口、AI 技能、文件下载、人与人消息保持原生参数，不套用语义不同的框架动作。
- 媒体：入站图片/富文本图片保留 downloadCode 为 FileId，通过 robot.robotMessageFileDownload 换取下载地址；它不是可直接复用的发送媒体 ID。标准媒体上传、文件、音视频、复杂卡片尚未映射。
- 交互：Stream 卡片回调收到后自动 ACK；不再将传输 ACK 注册为业务 interaction.ack。
- 状态：connection.status 返回驱动标准动作列表。未注册动作明确失败。

## 验证

`tests/platforms/dingtalk-api.test.mjs` 验证 GET 参数编码、PUT 请求、撤回凭据、表情失败、富文本图片及凭据隔离；`drivers.test.mjs` 验证 Stream ACK。离线测试不证明线上权限或消息投递。

## 核对来源

- [阿里云钉钉官方 SDK 2.2.48](https://www.npmjs.com/package/@alicloud/dingtalk/v/2.2.48)：robot_1_0 请求/响应字段与 HTTP 路由；仅整理协议契约，没有复制 SDK 实现。
- [钉钉官方 Stream SDK](https://github.com/open-dingtalk/dingtalk-stream-sdk-nodejs)
- [钉钉官方 Python SDK 消息模型](https://github.com/open-dingtalk/dingtalk-stream-sdk-python/blob/main/dingtalk_stream/chatbot.py)：picture/richText/downloadCode/isInAtList。

## 原生方法清单

清单中的 `httpOperations` 另记录驱动实际使用的 HTTP 路径模板和方法；动态请求保留 dynamic 标记，不推断为固定端点。

[api-inventory.json](api-inventory.json) 记录当前 API 对象的 46 个可调用方法路径、参数名称和上游声明位置；参数及返回值的详细类型以 SDK 声明为准。这不是平台所有 HTTP 端点的分母，也不保证所有方法都能经过 IPC 代理调用。

<!-- social-api-audit:start -->

## 框架动作逐项核对（自动生成）

当前框架声明 109 个标准动作，本包注册 7 个（含 connection.status、发送别名和媒体包装）。这是动作注册范围，不是平台 API 覆盖率；未映射保留为缺口，不自动判定为不适用。

| 框架动作                             | 源码状态 | 对应入口                                 |
| ------------------------------------ | -------- | ---------------------------------------- |
| `audio.control`                      | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `audio.join`                         | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `audio.leave`                        | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `audio.online`                       | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `channel.announce`                   | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `channel.api-permission.list`        | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `channel.api-permission.request`     | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `channel.create`                     | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `channel.delete`                     | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `channel.direct-session.open`        | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `channel.info`                       | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `channel.legacy-announcement.remove` | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `channel.legacy-announcement.set`    | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `channel.list`                       | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `channel.message-rate.get`           | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `channel.update`                     | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `connection.gateway`                 | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `connection.status`                  | 已注册   | 驱动处理；见 driver.ts                   |
| `file.send.channel`                  | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `file.send.user`                     | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `forum.create`                       | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `forum.delete`                       | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `forum.get`                          | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `forum.list`                         | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `guild.bot.info`                     | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `guild.info`                         | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `guild.leave`                        | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `guild.list`                         | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `guild.mute`                         | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `guild.mute.get`                     | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `guild.update`                       | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `history.list`                       | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `interaction.ack`                    | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `me.friends`                         | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `me.guilds`                          | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `me.info`                            | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `me.share`                           | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `me.threads`                         | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `media.complete`                     | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `media.part.finish`                  | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `media.prepare`                      | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `media.send`                         | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `media.send.channel`                 | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `media.send.user`                    | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `media.upload`                       | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `member.admin`                       | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `member.ban`                         | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `member.blacklist.list`              | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `member.blacklist.update`            | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `member.card`                        | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `member.info`                        | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `member.kick`                        | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `member.kick.batch`                  | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `member.list`                        | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `member.mute`                        | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `member.mute.batch`                  | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `member.search`                      | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `member.title`                       | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `member.unban`                       | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `mention.get`                        | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `menu.get`                           | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `menu.set`                           | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `message.delete`                     | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `message.edit`                       | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `message.forward.channel`            | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `message.forward.user`               | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `message.get`                        | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `message.intent`                     | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `message.pin`                        | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `message.send`                       | 已注册   | 驱动处理；见 driver.ts                   |
| `message.send.channel`               | 已注册   | 驱动处理；见 driver.ts                   |
| `message.send.target`                | 已注册   | 驱动处理；见 driver.ts                   |
| `message.send.user`                  | 已注册   | 驱动处理；见 driver.ts                   |
| `message.stream`                     | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `message.typing`                     | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `message.unpin`                      | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `panel.create`                       | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `panel.delete`                       | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `panel.get`                          | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `panel.list`                         | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `panel.targets.update`               | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `panel.update`                       | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `permission.get`                     | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `permission.set`                     | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `reaction.add`                       | 已注册   | robot.robotReplyEmotion                  |
| `reaction.list`                      | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `reaction.remove`                    | 已注册   | robot.robotRecallEmotion                 |
| `request.friend`                     | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `request.guild`                      | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `request.guild.decide`               | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `request.guild.list`                 | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `request.policy.create`              | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `request.policy.delete`              | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `request.policy.execute`             | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `request.policy.list`                | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `request.policy.update`              | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `request.policy.whitelist`           | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `role.assign`                        | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `role.create`                        | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `role.delete`                        | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `role.list`                          | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `role.remove`                        | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `role.update`                        | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `schedule.create`                    | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `schedule.delete`                    | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `schedule.get`                       | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `schedule.list`                      | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `schedule.update`                    | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |
| `user.info`                          | 未映射   | 原生调用或待补齐；不能据此判定平台不支持 |

<!-- social-api-audit:end -->
