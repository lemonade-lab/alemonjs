# 环境变量

`platform`:`string` 平台

`login`:`string` 登录

`LOG_PATH`:`string` log 地址

`PKG_PATH`:`string` package.json 地址

`NODE_ENV`:`development | production` 环境判断

`CFG_PATH`: `string`

# 配置

```yaml
# 常规配置
port: 17117 # 端口，快捷参数 --port
input: 'lib/index.js' # 入口地址，快捷参数 --input
login: 'discord' # 选择登录的平台，快捷参数 --login
url: 'ws://127.0.0.1:17117' # 连接阿柠檬服务URL，快捷参数 --url
is_full_receive: false # 不全量接收消息（用于分流处理）
# 禁用设置
disabled_text_regular: '/闭关' # 设置正则，若匹配则禁用
disabled_selects: # 禁用事件。若匹配则禁用
  'private.message.create': true # 禁用私聊
disabled_user_id:
  '1715713638': true # 若匹配则禁用
disabled_user_key:
  '123456': true # 多匹配则禁用
# 重定向：把指定的文本，转为指定的内容 （禁用规则比重定向优先）
redirect_regular: '^#' # 识别前缀 #
redirect_target: '/' # 替换为 /
# ismaster 设置
master_id:
  '1715713638': true
master_key:
  '123456': true
# bot 设置
bot_id:
  '1715713638': true # 把指定 id 视为 isBot
bot_key:
  '123456': true # 把指定bot kye 视为 isBot
# 处理器
processor:
  repeated_event_time: 60000 # 过滤掉 1分钟内出现相同 MessageId 的 event
  repeated_user_time: 1000 # 过滤掉 1秒内出现相同UserId 的 event
# 加载子模块 (支持 array 写法)
apps:
  'alemonjs-openai': true
# 模块配置, 约定。
# 模块对应的配置名，应是模块名。
alemonjs-openai:
  baseURL: 'https://api.deepseek.com'
  apiKey: ''
  model: 'deepseek-chat'
```
