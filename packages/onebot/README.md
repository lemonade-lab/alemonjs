# [https://alemonjs.com/](https://alemonjs.com/)

- alemomn.config.yaml

```yaml
onebot:
  # 缺省为 11。12 是实验性候选标准：仅支持正向/反向 WebSocket，协议不兼容时会告警并在本进程锁定降级为 v11。
  version: 11
  url: '' # 正向url
  token: '' # access_token
  reverse_enable: false # 启用后正向连接配置失效，地址：ws://127.0.0.1:17158
  reverse_port: 17158 # 返向连接服务端口，启用反向连接后生效
  # v12 多 Bot 主动发送使用；单 Bot 时可省略。格式 <platform>:<user_id>
  # default_bot: 'qq:123456'
  master_key: null
  # 使用 user_key
  master_key:
     - 'xxx'
  # 使用 user_id
  master_id:
     - 'yyy'
  # 隐藏不支持的消息类型（可选，默认: false）
  # 1：一级隐藏，不可读占位符（[视频]、[音频]、[图片]、[附件]等）被置空，可读内容保留
  # 2：二级隐藏，按钮仅显示指令数据（如 /挑战），链接仅显示 URL，MD mention 转为原生 at 消息段
  # 3：三级隐藏，按钮和链接的 data 也不保留，完全隐藏
  # 4：四级隐藏，不进行任何转换，降级数据直接丢弃
  # 转换后内容为空时，将跳过发送并输出 info 日志
  hideUnsupported: 1
```

## OneBot 12（实验功能）

将 `version` 显式设为 `12` 后，适配器会以 OneBot 12 双向 WebSocket 工作；HTTP、Webhook 和 MessagePack 尚未纳入首期范围。正向连接须以首个 `meta.connect` 的 `onebot_version: "12"` 完成协商；反向连接须协商 `12` 子协议，并在设置了 token 时带上匹配的认证头。

若探测到 v11 事件、v12 `meta.connect` 不匹配或探测超时，适配器会记录一次告警并自动降级为 v11，直到配置重载或进程重启。已建立 v12 会话后的网络断线只会按 v12 重连，不会降级。

运行时可通过 `useClient<API>().getConnectionStatus()` 读取请求版本、实际版本、降级原因、传输、连接状态和在线 Bot；桌面设置页也会显示相同信息，方便诊断同一 QQ 多端登录造成的连接切换。
