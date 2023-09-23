## puppeteer

```toml
[puppeteer]
# 指令参数
args = [
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--disable-setuid-sandbox',
  '--no-first-run',
  '--no-sandbox',
  '--no-zygote',
  '--single-process',
]
# 请求头
headless = 'new'
# 延迟
timeout = 30000
```

## redis

```toml
[redis]
# 地址
host = "127.0.0.1"
# 端口
port = 6379
# 密码
password = ""
# 数据库
db = 1
```

## mysql

```toml
[mysql]
# 地址
host = "127.0.0.1"
# 端口
port = 3306
# 账户
user = "root"
# 密码
password = ""
# 数据库
database = "alemon"
```

## server

```toml
[server]
# 地址
host = "127.0.0.1"
# 端口
port = 5000
```

## discord

```toml
[discord]
# 令牌
token = ''
# 主人编号
masterID = ''
# 主人密码
password = ''
# 监听事件
intents = [8_192, 16_384, 4_096, 1_024, 2_048, 512, 1, 32_768]
```

## kook

```toml
[kook]
# 令牌
token = ''
# 主人编号
masterID = ''
# 主人密码
password = ''
```

## villa

```toml
[villa]
# 机器人账户
bot_id = ''
# 密钥
secret = ''
# 公钥
pub_key = """-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCcw5zU/MD+HvVGKPYlI1VqtUK0
iaWfnSqdRCmsik2Q5zU6/bV5Cnp8Jog9XfZlkELR9cRfQDKlbM2YWEJKBXFlEoHg
8/mOnJYxLhFhphx3H8bTbWOAXqPta5vs/mhx1DSZ8QWm6veql8RbLYalBsa0cZBM
AXOJS+y0YTdkpztycQIDAQAB
-----END PUBLIC KEY-----
"""
# 主人编号
masterID = ''
# 主人密码
password = ''
# 可更改为https
http = 'http'
# 回调地址
url = '/api/mys/callback'
# 回调接口
port = 8080
# 图片缓存空间
size = 999999
# 图片请求路径
img_url = '/api/mys/img'
# 图片缓存路径
IMAGE_DIR = '/data/mys/img'
```

## qq

```toml
[qq]
# 应用编号
appID = ''
# 令牌
token = ''
# 主人编号
masterID = ''
# 主人密码
password = ''
# 监听事件
intents = [
  "GUILDS",
  "GUILD_MEMBERS",
  "DIRECT_MESSAGE",
  "PUBLIC_GUILD_MESSAGES",
]
# 是否是私域  默认公域
isPrivate = false
# 是否是沙箱  默认部署
sandbox = false
```

## qqgroup

```toml
[qqgroup]
# 机器人账户
account = ''
# 机器人密码
password = ''
# 登录设备
device = ''
# 主人编号
masterID = ''
# 主人密码
masterPW = ''
# 签名API地址(如:http://127.0.0.1:8080/sign?key=12315)
sign_api_addr = ''
# 传入的QQ版本(如:8.9.63、8.9.68)
version = 0
# 好友同意
friendApplication = false
# 群聊
groupInvitation = false
# 加群同意
addGroupApplication = false
# 机器人账号集
botQQ = []
```
