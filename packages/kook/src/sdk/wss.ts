import WebSocket from 'ws';
import { config } from './config.js';
import { EventData, SystemData } from './typings.js';
import { KOOKOptions } from './wss.types.js';
import { KOOKAPI } from './api.js';
import { KOOKEventMap } from './message.js';
import { ConversationMap } from './conversation.js';
export class KOOKClient extends KOOKAPI {
  // 标记是否已连接
  #isConnected = false;

  // 存储 session Id
  #sessionId = null;

  // 存储最新的消息序号
  #lastMessageSN = 0;

  /**
   *
   * @param opstion
   */
  constructor(opstion: KOOKOptions) {
    super();
    config.set('token', opstion.token);
  }

  #ws: WebSocket;

  #events: {
    [K in keyof KOOKEventMap]?: (event: KOOKEventMap[K]) => any;
  } = {};

  /**
   * 注册事件处理程序
   * @param key 事件名称
   * @param val 事件处理函数
   */
  on<T extends keyof KOOKEventMap>(key: T, val: (event: KOOKEventMap[T]) => any) {
    this.#events[key] = val;

    return this;
  }

  /**
   * 使用获取到的网关连接地址建立 WebSocket 连接
   * @param token
   * @param conversation
   */
  async connect() {
    // 请求url
    const gatewayUrl = await this.gateway()
      .then(res => res?.data?.url)
      .catch(err => {
        if (this.#events['ERROR']) {
          this.#events['ERROR'](err);
        }
      });

    if (!gatewayUrl && gatewayUrl == '') {
      return;
    }

    // 建立连接

    const map = {
      0: async ({ d, sn }: { d: EventData | SystemData; sn: any }) => {
        /**
         * 处理 EVENT 信令
         * 包括按序处理消息和记录最新的消息序号
         */
        if (d && sn) {
          if (sn === this.#lastMessageSN + 1) {
            /**
             * 消息序号正确
             * 按序处理消息
             */
            this.#lastMessageSN = sn;
            try {
              if (d.channel_type == 'GROUP') {
                const t = ConversationMap[d.type]['public'](d);

                if (this.#events[t]) {
                  await this.#events[t](d);
                }
              } else {
                const t = ConversationMap[d.type]['direct'](d);

                if (this.#events[t]) {
                  await this.#events[t](d);
                }
              }
            } catch (err) {
              if (this.#events['ERROR']) {
                this.#events['ERROR'](err);
              }
            }

            //
          } else if (sn > this.#lastMessageSN + 1) {
            /**
             * 消息序号乱序
             * 存入暂存区等待正确的序号处理
             * 存入暂存区
             */
          }
          /**
           * 如果收到已处理过的消息序号
           * 则直接丢弃
           */
        }
      },
      1: ({ d }) => {
        if (d && d.code === 0) {
          console.info('[ws] ok');
          this.#sessionId = d.session_id;
          this.#isConnected = true;
        } else {
          console.info('[ws] err');
        }
      },
      2: () => {
        console.info('[ws] ping');
        this.#ws.send(
          JSON.stringify({
            s: 3
          })
        );
      },
      3: () => {
        console.info('[ws] pong');
      },
      4: () => {
        console.info('[ws] resume');
      },
      5: () => {
        console.info('[ws] Connection failed, reconnect');
        /**
         * 处理 RECONNECT 信令
         * 断开当前连接并进行重新连接
         */
        this.#isConnected = false;
        this.#sessionId = null;
        console.info('[ws] sessionId', this.#sessionId);
      },
      6: () => {
        console.info('[ws] resume ack');
      }
    };

    this.#ws = new WebSocket(gatewayUrl);

    this.#ws.on('open', () => {
      console.info('[ws] open');
    });

    this.#ws.on('message', async msg => {
      const message = JSON.parse(msg.toString('utf8'));

      if (process.env.KOOK_WS == 'dev') {
        console.info('message', message);
      }
      if (map[message.s]) {
        map[message.s](message);
      }
    });

    // 心跳定时发送
    setInterval(() => {
      if (this.#isConnected) {
        this.#ws.send(
          JSON.stringify({
            s: 2,
            sn: this.#lastMessageSN
          })
        );
      }
    }, 30000);

    this.#ws.on('close', () => {
      console.error('[ws] close');
    });

    this.#ws.on('error', err => {
      console.error('[ws] error', err);
    });
  }
}
