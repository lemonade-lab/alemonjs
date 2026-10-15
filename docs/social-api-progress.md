# 社交适配包 API 核对进度

本轮按 scripts/social-platforms.json 的顺序建立 18 包的对照清单、核对已有注册动作，并修复已确认的连接缺口。API 清单是当前 SDK/驱动公开方法范围，不是厂商所有 HTTP API；框架对照包含当前 109 个标准动作。未映射项保留为缺口，不假定平台不支持。

| 顺序 | 包与逐项对照 | 原生方法清单 | 框架动作注册 | API 类型状态 |
|---|---|---:|---:|---|
| 1 | [@alemonjs/dingtalk](../packages/dingtalk/API.md) | 46 | 7/109 | 具名机器人契约 |
| 2 | [@alemonjs/feishu](../packages/feishu/API.md) | 3217 | 25/109 | SDK 原生类型 |
| 3 | [@alemonjs/google-chat](../packages/google-chat/API.md) | 54 | 15/109 | SDK 原生类型 |
| 4 | [@alemonjs/heybox](../packages/heybox/API.md) | 1 | 16/109 | 通用 request，端点契约待补 |
| 5 | [@alemonjs/icqq](../packages/icqq/API.md) | 138 | 30/109 | SDK 原生类型 |
| 6 | [@alemonjs/instagram](../packages/instagram/API.md) | 1 | 8/109 | 通用 request，端点契约待补 |
| 7 | [@alemonjs/irc](../packages/irc/API.md) | 53 | 11/109 | 上游无声明，类型待补 |
| 8 | [@alemonjs/line](../packages/line/API.md) | 140 | 14/109 | SDK 原生类型 |
| 9 | [@alemonjs/matrix](../packages/matrix/API.md) | 415 | 23/109 | SDK 原生类型 |
| 10 | [@alemonjs/mattermost](../packages/mattermost/API.md) | 634 | 30/109 | SDK 原生类型 |
| 11 | [@alemonjs/messenger](../packages/messenger/API.md) | 1 | 8/109 | 通用 request，端点契约待补 |
| 12 | [@alemonjs/slack](../packages/slack/API.md) | 295 | 27/109 | SDK 原生类型 |
| 13 | [@alemonjs/teams](../packages/teams/API.md) | 220 | 16/109 | SDK 原生类型 |
| 14 | [@alemonjs/twitch](../packages/twitch/API.md) | 509 | 12/109 | SDK 原生类型 |
| 15 | [@alemonjs/wechat-kf](../packages/wechat-kf/API.md) | 3 | 9/109 | 通用 request，端点契约待补 |
| 16 | [@alemonjs/wechat-official](../packages/wechat-official/API.md) | 255 | 8/109 | 上游无声明，类型待补 |
| 17 | [@alemonjs/whatsapp](../packages/whatsapp/API.md) | 1 | 9/109 | 通用 request，端点契约待补 |
| 18 | [@alemonjs/zulip](../packages/zulip/API.md) | 30 | 16/109 | 上游无声明，类型待补 |

动作数量含 connection.status、4 个或受限的发送别名，以及媒体转发包装，不代表同等数量的独立业务能力。原生方法数量不用于平台功能完成率计算；钉钉的 29 个机器人 HTTP 操作是经过固定服务版本核对的独立范围，其他包的大型 SDK 则枚举公共方法。

## 本轮已补齐

1. 钉钉：29 个 robot_1_0 操作的具名方法、请求/响应类型、GET/POST/PUT 路由；补表情增删、富文本图片及 downloadCode 保留；撤回继续使用真实 processQueryKey。
2. 飞书：导出真实 Client 类型，按当前 app 身份分页查找 reaction_id 后移除表情，补表情查询参数，并实现 media.upload / fileId 复用发送。
3. Google Chat：导出 Chat 类型，卡片点击保留 DM 会话路由；标准媒体限定为已实现的图片。
4. ICQQ、LINE、Matrix、Mattermost、Slack、Teams、Twitch：公共 API 类型直接引用上游，避免 SDK 测试注入的 any 污染导出类型。
5. Matrix：message.get 从框架事件或目标取得房间 ID；Slack：频道列表转发 cursor/limit。
6. LINE、Google Chat、微信公众号：不再注册尚未实现的文件发送包装，媒体类型在调用前校验。
7. 全部 18 包：content.text 和直接 Markdown 输入保留，未映射模板/keyboard/media/card 明确失败；连接事件补齐必需 value 字段。
8. 全部 18 包：API.md 对照 109 个动作；api-inventory.json 记录 SDK 公开方法和声明位置；自动核对命令防止动作表漂移。

## 尚未完成

- 逐个 SDK 原生方法的权限、参数语义、响应与 IPC 序列化适用性审计。方法枚举和 SDK 类型不能替代此项。
- Heybox、Meta 三包、微信客服的全部平台端点具名契约；当前仍有通用 request 入口。
- IRC、wechat-api、zulip-js 缺少上游随包类型，完整参数及返回类型需要逐方法补齐。
- 各 API.md 中标为未映射的动作，需要进一步区分适用待实现、平台专有、权限受限和不适用；本轮不把这些项标为完成。
- 结构化 keyboard/media/card、模板发送、除飞书外的独立 media.upload、复杂响应和真实账号验证仍需逐平台推进。

## 可重复验证

- yarn audit:social：核对框架动作表；node scripts/audit-social-apis.mjs --write 更新。
- node scripts/inventory-social-native-api.mjs <name>：重新枚举一个包的原生 API；按清单顺序运行。
- yarn test:social：核心构建、动作表检查、API 类型契约及离线平台测试。
- yarn build:social / yarn lint:social：18 包构建和逐包 lint。
- node_modules/.bin/tsc -p packages/<name>/tsconfig.json --noEmit：按各包当前编译设置检查，当前 strict=false。

构建、类型和离线测试均不证明真实账号登录、平台权限或线上投递完成。

## 本轮验证结果

2026-10-15：81 项离线测试通过；18 包构建与逐包 lint 通过；18 包按现有 strict=false 配置的类型检查通过，另有导出 API 类型契约检查。动作表检查及 git diff --check 通过。未进行真实账号验证。
