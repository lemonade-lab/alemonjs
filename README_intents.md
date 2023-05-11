# 事件订阅

> 该订阅仅用于配置 config.yaml

> 插件指令监听事件匹配请查看 src/lib/plugins

GUILDS (1 << 0)

- GUILD_CREATE // 当机器人加入新 guild 时
- GUILD_UPDATE // 当 guild 资料发生变更时
- GUILD_DELETE // 当机器人退出 guild 时
- CHANNEL_CREATE // 当 channel 被创建时
- CHANNEL_UPDATE // 当 channel 被更新时
- CHANNEL_DELETE // 当 channel 被删除时

GUILD_MEMBERS (1 << 1)

- GUILD_MEMBER_ADD // 当成员加入时
- GUILD_MEMBER_UPDATE // 当成员资料变更时
- GUILD_MEMBER_REMOVE // 当成员被移除时

DIRECT_MESSAGE (1 << 12)

- DIRECT_MESSAGE_CREATE // 当收到用户发给机器人的私信消息时
- DIRECT_MESSAGE_DELETE // 删除（撤回）消息事件

PUBLIC*GUILD_MESSAGES (1 << 30) // 消息事件，此为 *公域\_ 的消息事件

- AT_MESSAGE_CREATE // 当收到@机器人的消息时
- PUBLIC_MESSAGE_DELETE // 当频道的消息被删除时

GUILD*MESSAGES (1 << 9) // 消息事件，仅 *私域\_ 机器人能够设置此 intents

- MESSAGE_CREATE // 发送消息事件，代表频道内的全部消息，而不只是 at 机器人的消息。
- 内容与 AT_MESSAGE_CREATE 相同
- MESSAGE_DELETE // 删除（撤回）消息事件

FORUMS*EVENT (1 << 28) // 论坛事件，仅 *私域\_ 机器人能够设置此 intents

- FORUM_THREAD_CREATE // 当用户创建主题时
- FORUM_THREAD_UPDATE // 当用户更新主题时
- FORUM_THREAD_DELETE // 当用户删除主题时
- FORUM_POST_CREATE // 当用户创建帖子时
- FORUM_POST_DELETE // 当用户删除帖子时
- FORUM_REPLY_CREATE // 当用户回复评论时
- FORUM_REPLY_DELETE // 当用户删除评论时
- FORUM_PUBLISH_AUDIT_RESULT // 当用户发表审核通过时

GUILD_MESSAGE_REACTIONS (1 << 10)

- MESSAGE_REACTION_ADD // 为消息添加表情表态
- MESSAGE_REACTION_REMOVE // 为消息删除表情表态

INTERACTION (1 << 26)

- INTERACTION_CREATE // 互动事件创建时

MESSAGE_AUDIT (1 << 27)

- MESSAGE_AUDIT_PASS // 消息审核通过
- MESSAGE_AUDIT_REJECT // 消息审核不通过

AUDIO_ACTION (1 << 29)

- AUDIO_START // 音频开始播放时
- AUDIO_FINISH // 音频播放结束时
- AUDIO_ON_MIC // 上麦时
- AUDIO_OFF_MIC // 下麦时
