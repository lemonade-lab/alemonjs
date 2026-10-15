# @alemonjs/slack API 与框架对应

核对范围：当前本地驱动、框架标准动作声明和安装的依赖，核对日期 2026-10-15。这里区分原生 API 可达、框架动作注册和内容/结果真正支持；不把 SDK 导出认定为全部平台 API 已审计。

## 原生入口

Bolt App.client，即 WebClient，直接引用 SDK 公共类型。

主要入口：chat、conversations、users、files、pins、reactions；其他 Web API 命名空间保持原生调用。

依赖版本：`@slack/bolt@5.1.0`, `undici@^7.0.0`。

通过框架 `useClient<API>(event)` 的点分方法调用会进入 `client.api` 通道，参数必须可跨进程序列化，响应外层为框架 `Result[]`。SDK 需要 Stream、callback、异步迭代器或对象句柄的方法，应在平台进程直接使用 SDK；通用代理不等于所有 SDK 方法可以无损远程调用。

## 内容和语义边界

用户私聊先 conversations.open；消息标识是 ts。文件上传响应不等于消息投递回执。标准消息获取、权限及菜单等未映射；频道列表支持 cursor/limit。

统一发送兼容 `params.format` 以及 `params.content.text` / `params.content.markdown.content`。模板 ID、结构化 keyboard/media/card 尚未通过新 content 接口映射，明确拒绝而不是丢弃字段；已有按钮/媒体可使用驱动支持的 format 或原生 API。Markdown 在部分驱动中按纯文本发送，不保证平台原生富文本渲染。

查询结果按可用字段整理用户、群、频道等信息并保留原始 value；消息、历史、反应和回执不能仅凭动作名称视为已完整标准化。下方逐动作表明确保留未映射项，完整平台端点覆盖率尚无经过审计的分母。

## 核对来源与验证

- [上游 SDK / 官方接口文档](https://github.com/slackapi/bolt-js)
- 当前安装依赖的公共声明或 SDK 源码；框架声明位于 `packages/alemonjs/src/types/actions.ts`、`messaging.ts`。
- `yarn test:social` 使用 SDK 注入及本地回调验证，不包含真实账号端到端验证。
- `node scripts/audit-social-apis.mjs` 检查下方表与当前源码是否一致；修改动作后使用 `--write` 更新。

## 原生方法清单

清单中的 `httpOperations` 另记录驱动实际使用的 HTTP 路径模板和方法；动态请求保留 dynamic 标记，不推断为固定端点。

[api-inventory.json](api-inventory.json) 记录当前 API 对象的 295 个可调用方法路径、参数名称和上游声明位置；参数及返回值的详细类型以 SDK 声明为准。这不是平台所有 HTTP 端点的分母，也不保证所有方法都能经过 IPC 代理调用。

<!-- social-api-audit:start -->

## 框架动作逐项核对（自动生成）

当前框架声明 109 个标准动作，本包注册 27 个（含 connection.status、发送别名和媒体包装）。这是动作注册范围，不是平台 API 覆盖率；未映射保留为缺口，不自动判定为不适用。

| 框架动作                             | 源码状态             | 对应入口                                           |
| ------------------------------------ | -------------------- | -------------------------------------------------- |
| `audio.control`                      | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `audio.join`                         | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `audio.leave`                        | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `audio.online`                       | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `channel.announce`                   | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `channel.api-permission.list`        | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `channel.api-permission.request`     | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `channel.create`                     | 已注册               | client.conversations.create                        |
| `channel.delete`                     | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `channel.direct-session.open`        | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `channel.info`                       | 已注册               | client.conversations.info                          |
| `channel.legacy-announcement.remove` | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `channel.legacy-announcement.set`    | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `channel.list`                       | 已注册               | client.conversations.list                          |
| `channel.message-rate.get`           | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `channel.update`                     | 已注册               | client.conversations.rename                        |
| `connection.gateway`                 | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `connection.status`                  | 已注册               | 驱动处理；见 driver.ts                             |
| `file.send.channel`                  | 包装注册，按内容受限 | withMedia → message.send.channel（内容受驱动限制） |
| `file.send.user`                     | 包装注册，按内容受限 | withMedia → message.send.user（内容受驱动限制）    |
| `forum.create`                       | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `forum.delete`                       | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `forum.get`                          | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `forum.list`                         | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `guild.bot.info`                     | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `guild.info`                         | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `guild.leave`                        | 已注册               | client.conversations.leave                         |
| `guild.list`                         | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `guild.mute`                         | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `guild.mute.get`                     | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `guild.update`                       | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `history.list`                       | 已注册               | client.conversations.history                       |
| `interaction.ack`                    | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `me.friends`                         | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `me.guilds`                          | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `me.info`                            | 已注册               | client.auth.test                                   |
| `me.share`                           | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `me.threads`                         | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `media.complete`                     | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `media.part.finish`                  | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `media.prepare`                      | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `media.send`                         | 包装注册，按内容受限 | withMedia → message.send.target（内容受驱动限制）  |
| `media.send.channel`                 | 包装注册，按内容受限 | withMedia → message.send.channel（内容受驱动限制） |
| `media.send.user`                    | 包装注册，按内容受限 | withMedia → message.send.user（内容受驱动限制）    |
| `media.upload`                       | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `member.admin`                       | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `member.ban`                         | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `member.blacklist.list`              | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `member.blacklist.update`            | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `member.card`                        | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `member.info`                        | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `member.kick`                        | 已注册               | client.conversations.kick                          |
| `member.kick.batch`                  | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `member.list`                        | 已注册               | client.conversations.members                       |
| `member.mute`                        | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `member.mute.batch`                  | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `member.search`                      | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `member.title`                       | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `member.unban`                       | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `mention.get`                        | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `menu.get`                           | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `menu.set`                           | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `message.delete`                     | 已注册               | client.chat.delete                                 |
| `message.edit`                       | 已注册               | client.chat.update                                 |
| `message.forward.channel`            | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `message.forward.user`               | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `message.get`                        | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `message.intent`                     | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `message.pin`                        | 已注册               | client.pins.add                                    |
| `message.send`                       | 已注册               | 驱动处理；见 driver.ts                             |
| `message.send.channel`               | 已注册               | 驱动处理；见 driver.ts                             |
| `message.send.target`                | 已注册               | 驱动处理；见 driver.ts                             |
| `message.send.user`                  | 已注册               | 驱动处理；见 driver.ts                             |
| `message.stream`                     | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `message.typing`                     | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `message.unpin`                      | 已注册               | client.pins.remove                                 |
| `panel.create`                       | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `panel.delete`                       | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `panel.get`                          | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `panel.list`                         | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `panel.targets.update`               | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `panel.update`                       | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `permission.get`                     | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `permission.set`                     | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `reaction.add`                       | 已注册               | client.reactions.add                               |
| `reaction.list`                      | 已注册               | client.reactions.get                               |
| `reaction.remove`                    | 已注册               | client.reactions.remove                            |
| `request.friend`                     | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `request.guild`                      | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `request.guild.decide`               | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `request.guild.list`                 | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `request.policy.create`              | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `request.policy.delete`              | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `request.policy.execute`             | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `request.policy.list`                | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `request.policy.update`              | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `request.policy.whitelist`           | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `role.assign`                        | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `role.create`                        | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `role.delete`                        | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `role.list`                          | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `role.remove`                        | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `role.update`                        | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `schedule.create`                    | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `schedule.delete`                    | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `schedule.get`                       | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `schedule.list`                      | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `schedule.update`                    | 未映射               | 原生调用或待补齐；不能据此判定平台不支持           |
| `user.info`                          | 已注册               | client.users.info                                  |

<!-- social-api-audit:end -->
