import WebSocket, { WebSocketServer } from 'ws';
import { consume, OneBotAPI } from './api';
import { OneBotEventMap } from './typing';
import dayjs from 'dayjs';

/**
 * 连接
 */
export class OneBotClient extends OneBotAPI {
  #options = {
    url: '',
    access_token: '',
    reverse_enable: false,
    reverse_port: 17158
  };

  /**
   * 设置配置
   * @param opstion
   */
  constructor(opstion: { url: string; access_token: string; reverse_enable: boolean; reverse_port: number }) {
    super();
    for (const key in opstion) {
      if (Object.prototype.hasOwnProperty.call(opstion, key)) {
        this.#options[key] = opstion[key];
      }
    }
  }

  #events: {
    [K in keyof OneBotEventMap]?: (event: OneBotEventMap[K]) => any;
  } = {};

  // 重连次数
  #count = 0;
  #getReConnectTime() {
    const time = this.#count > 3 ? 1000 * 6 : 1000 * 1;
    const curTime = this.#count > 6 ? 1000 * this.#count * 2 : time;

    logger.info(`[OneBot] 等待 ${dayjs(curTime).format('mm:ss')} 后重新连接`);
    this.#count++;

    return curTime;
  }

  /**
   * 注册事件处理程序
   * @param key 事件名称
   * @param val 事件处理函数
   */
  on<T extends keyof OneBotEventMap>(key: T, val: (event: OneBotEventMap[T]) => any) {
    this.#events[key] = val;

    return this;
  }

  /**
   *
   * @param cfg
   * @param conversation
   */
  connect() {
    const { url, access_token: token, reverse_enable, reverse_port } = this.#options;

    const notToken = !token || token === '';

    const c = notToken
      ? {}
      : {
          headers: {
            ['Authorization']: `Bearer ${token}`
          }
        };

    const onMessage = data => {
      try {
        const event = JSON.parse(data.toString());

        if (!event) {
          logger.error('[OneBot] WebSocket message is empty');
        } else if (event?.post_type === 'meta_event') {
          if (this.#events['META']) {
            this.#events['META'](event);
          }
        } else if (event?.post_type === 'message') {
          if (event?.message_type === 'group') {
            if (this.#events['MESSAGES']) {
              this.#events['MESSAGES'](event);
            }
          } else if (event?.message_type === 'private') {
            if (this.#events['DIRECT_MESSAGE']) {
              this.#events['DIRECT_MESSAGE'](event);
            }
          }
        } else if (event?.post_type === 'notice') {
          if (event?.notice_type === 'group_increase') {
            // 群成员增加
            if (this.#events['NOTICE_GROUP_MEMBER_INCREASE']) {
              this.#events['NOTICE_GROUP_MEMBER_INCREASE'](event);
            }
          } else if (event?.notice_type === 'group_decrease') {
            // 群成员减少
            if (this.#events['NOTICE_GROUP_MEMBER_REDUCE']) {
              this.#events['NOTICE_GROUP_MEMBER_REDUCE'](event);
            }
          }
        } else if (event?.post_type === 'request') {
          // 收到加群 或 加好友的请求。
          if (event?.request_type === 'friend') {
            if (this.#events['REQUEST_ADD_FRIEND']) {
              this.#events['REQUEST_ADD_FRIEND'](event);
            }
          } else if (event?.request_type === 'group') {
            if (this.#events['REQUEST_ADD_GROUP']) {
              this.#events['REQUEST_ADD_GROUP'](event);
            }
          }
        } else if (event?.echo) {
          // 消费
          consume(event);
        }
      } catch (err) {
        logger.error('[OneBot] WebSocket error: ', err);
      }
    };

    const onClose = (code, reason) => {
      logger.error(`[OneBot] WebSocket closed: ${code} - ${reason.toString('utf8')}`);
      if (reverse_enable) {
        return;
      }
      const curTime = this.#getReConnectTime();

      setTimeout(() => {
        this.connect();
      }, curTime);
    };

    if (!this.ws) {
      if (reverse_enable) {
        // reverse_open
        const server = new WebSocketServer({ port: reverse_port ?? 17158 });

        server.on('connection', ws => {
          this.ws = ws;
          // message
          this.ws.on('message', onMessage);
          // close
          this.ws.on('close', onClose);
          logger.info(`[OneBot] connected: ws://127.0.0.1:${reverse_port}`);
        });
      } else {
        // forward_open
        this.ws = new WebSocket(url, c);
        this.ws.on('open', () => {
          logger.info(`[OneBot] connected: ${url}`);
          this.#count = 0;
        });
        // message
        this.ws.on('message', onMessage);
        // close
        this.ws.on('close', onClose);
      }
    }
  }
}
