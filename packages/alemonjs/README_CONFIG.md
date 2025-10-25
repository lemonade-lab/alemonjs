## 配置相关

### 基础配置

```yaml
# === 服务器配置 ===
port: 17117 # CBP服务器端口，快捷参数 --port
serverPort: 18110 # 应用服务器端口（可选，仅在需要Web服务时设置）

# === 应用配置 ===
input: 'lib/index.js' # 应用入口文件路径，快捷参数 --input
login: 'discord' # 登录平台标识，快捷参数 --login
url: 'ws://127.0.0.1:17117' # CBP服务器连接地址，快捷参数 --url
is_full_receive: false # 是否全量接收消息（用于分流处理）

# === CBP（Chat Bot Protocol）配置 ===
loadBalanceStrategy: 'least-connections' # 负载均衡策略，快捷参数 --loadBalanceStrategy
```

### 权限管理

```yaml
# === 主人权限设置 ===
master_id:
  '1715713638': true # 通过用户ID设置主人权限
master_key:
  '123456': true # 通过用户Key设置主人权限

# === 机器人标识设置 ===
bot_id:
  '1715713638': true # 将指定用户ID标识为机器人
bot_key:
  '123456': true # 将指定用户Key标识为机器人
```

### 消息过滤与控制

```yaml
# === 禁用控制 ===
disabled_text_regular: '/闭关' # 文本正则匹配，若匹配则禁用所有功能
disabled_selects: # 禁用特定事件类型
  'private.message.create': true # 禁用私聊消息
  'message.create': true # 禁用群组消息
  'interaction.create': true # 禁用交互事件
disabled_user_id: # 禁用特定用户ID
  '1715713638': true
disabled_user_key: # 禁用特定用户Key
  '123456': true

# === 文本重定向 ===
redirect_text_regular: '^#' # 文本前缀匹配正则
redirect_text_target: '/' # 将匹配的前缀替换为指定内容

# === 文本映射规则 ===
mapping_text:
  - regular: '/开始游戏' # 匹配的文本
    target: '/踏入仙途' # 替换成的文本
  - regular: '/帮助'
    target: '/help'
```

### 消息处理器配置

```yaml
processor:
  repeated_event_time: 60000 # 过滤重复MessageId的时间窗口（毫秒）
  repeated_user_time: 1000 # 过滤同一用户连续消息的时间窗口（毫秒）
```

### 模块管理

```yaml
# === 子模块配置 ===
apps:
  'alemonjs-openai': true # 启用OpenAI模块
  'alemonjs-xianyu': true # 启用咸鱼模块
  # 也支持数组格式
  # - 'alemonjs-openai'
  # - 'alemonjs-xianyu'

# === 模块特定配置 ===
# 模块配置的键名应与模块名一致
alemonjs-openai:
  baseURL: 'https://api.deepseek.com'
  apiKey: 'your-api-key-here'
  model: 'deepseek-chat'
```

## 快捷参数

启动时可使用的快捷参数：

```bash
# === 基础参数 ===
# 指定CBP服务器端口
node index.js --port 8080

# 指定应用服务器端口
node index.js --serverPort 3000

# 指定入口文件
node index.js --input ./lib/index.js

# 指定登录平台
node index.js --login discord

# 指定CBP服务器连接地址
node index.js --url ws://localhost:8080

# === CBP相关参数 ===
# 指定负载均衡策略
node index.js --loadBalanceStrategy least-connections

# 启用全量接收模式
node index.js --is_full_receive true

# === 组合使用示例 ===
# 启动Discord平台，使用轮询策略，端口8080
node index.js --login discord --loadBalanceStrategy round-robin --port 8080
```

## 配置管理工具

使用 `alemonc` 命令行工具来管理配置：

```bash
# 查看帮助
npx alemonc -h

# 添加模块
alemonc add apps alemonjs-openai alemonjs-xianyu

# 移除模块
alemonc remove apps alemonjs-openai

# 设置配置项
alemonc set login qq
alemonc set discord.token your-token
alemonc set loadBalanceStrategy least-connections

# 删除配置项
alemonc del discord

# 获取配置项
alemonc get login
```

## 基础环境变量

`platform`:`string` - 平台标识，支持的平台类型包括：

- `discord` - Discord 平台
- `qq` - QQ 平台
- `telegram` - Telegram 平台
- 或其他自定义平台包名（如：`@alemonjs/xxx`）

`login`:`string` - 登录标识，通常与平台名称相同或为平台的特定实例名

`url`:`string` - CBP 服务器连接地址，默认为 `ws://127.0.0.1:17117`

`port`:`string | number` - CBP 服务器端口，默认为 `17117`

`serverPort`:`string | number` - 应用服务器端口（可选，仅在需要启动 Web 服务时设置）

`is_full_receive`:`string` - 是否全量接收消息，可选值：`'true'` | `'1'` | `'false'` | `'0'`

## 文件路径相关

`LOG_PATH`:`string` - 日志文件存储路径

`PKG_PATH`:`string` - package.json 文件路径，默认为当前工作目录下的 `package.json`

`CFG_PATH`:`string` - 配置文件路径，默认为当前工作目录下的 `alemon.config.yaml`

## 运行环境

`NODE_ENV`:`development | production` - 环境判断，用于区分开发环境和生产环境

## CBP

ChatBot Protocol

ALemonJS 的核心通信协议，负责客户端与平台之间的消息传输和负载均衡。

### 负载均衡策略

```yaml
# 负载均衡策略配置
loadBalanceStrategy: 'least-connections' # 默认策略

# 支持的策略类型：
# - 'round-robin': 轮询算法
# - 'least-connections': 最少连接算法（推荐）
# - 'random': 随机算法
# - 'first-available': 首个可用算法

# 支持的策略类型：
# - 'round-robin': 轮询算法
# - 'least-connections': 最少连接算法（推荐）
# - 'random': 随机算法
# - 'first-available': 首个可用算法

#1. **轮询算法 (round-robin)**
#   - 按固定顺序依次分配请求
#   - 适用于客户端处理能力相近的场景
#   - 请求分布均匀

#2. **最少连接算法 (least-connections)**
#   - 优选当前连接数最少的客户端
#   - 适用于客户端处理能力不同的场景
#   - 提供最优的负载分配

#3. **随机算法 (random)**
#   - 随机选择可用客户端
#   - 简单的概率性分布
#   - 适用于临时测试场景

#4. **首个可用算法 (first-available)**
#   - 总是选择第一个健康的客户端
#   - 类似主备模式
#   - 适用于有优先级需求的场景
```

### CBP 连接配置

```yaml
# CBP服务器配置
cbp:
  # 连接超时时间（毫秒）
  timeout: 180000 # 3分钟

  # 重连间隔（毫秒）
  reconnectInterval: 6000 # 6秒

  # 心跳间隔（毫秒）
  heartbeatInterval: 18000 # 18秒

  # 健康检查间隔（毫秒）
  healthCheckInterval: 30000 # 30秒

  # 连接认证头配置
  headers:
    user-agent: 'platform' # 平台标识
    x-device-id: 'auto-generated' # 设备ID（自动生成）
    x-full-receive: '0' # 是否全量接收：'1' 开启，'0' 关闭
```
