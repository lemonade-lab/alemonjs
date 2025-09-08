import { createResult, ResultCode, getConfigValue, cbpPlatform, PublicEventMessageCreate } from 'alemonjs';

// 平台名称
export const platform = 'bot-name';
// 接口
export class API {}
// 配置参数
export type Options = {
  token: string;
};

const getBotConfig = (): Options => {
  const value = getConfigValue() || {};
  return value[platform] || {};
};

class Client extends API {
  #token: string;

  constructor(options: Options) {
    super();
    this.#token = options.token;
  }

  onmessage = (data: any) => {
    //
  };
}

export default () => {
  // 得到自定义配置
  const config = getBotConfig();

  /**
   * 连接 dbp 服务器。推送标准信息。
   */
  const port = process.env?.port || 17117;
  const url = `ws://127.0.0.1:${port}`;
  const cbp = cbpPlatform(url);

  const client = new Client({
    token: config.token
  });

  client.onmessage = data => {
    const e: PublicEventMessageCreate = {
      name: 'message.create',
      value: data
      // ...
    } as any;

    // event
    cbp.send(e);
  };

  const sendMessage = async (event, param) => {
    // 处理  client.send
    return [];
  };

  cbp.onactions(async (data, consume) => {
    if (data.action === 'message.send') {
      const event = data.payload.event;
      const paramFormat = data.payload.params.format;
      const res = await sendMessage(event, paramFormat);
      consume(res);
    } else if (data.action === 'message.send.channel') {
      const channel_id = data.payload.ChannelId;
      const val = data.payload.params.format;
    } else if (data.action === 'message.send.user') {
      const user_id = data.payload.UserId;
      const val = data.payload.params.format;
    } else if (data.action === 'mention.get') {
      const event = data.payload.event;
    }
  });

  // 处理 api 调用
  cbp.onapis(async (data, consume) => {
    const key = data.payload?.key;
    if (client[key]) {
      // 如果 client 上有对应的 key，直接调用。
      const params = data.payload.params;
      const res = await client[key](...params);
      consume([createResult(ResultCode.Ok, '请求完成', res)]);
    }
  });
};
