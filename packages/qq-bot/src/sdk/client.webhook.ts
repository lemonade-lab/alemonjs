import { QQBotAPI } from './api.js';
import { QQBotEventMap } from './message.js';
import bodyParser from 'koa-bodyparser';
import Router from 'koa-router';
import { WebhookAPI } from './webhook.secret.js';
import Koa from 'koa';
import { v4 as uuidv4 } from 'uuid';
import { WebSocket, WebSocketServer } from 'ws';
import { Options } from '../config.js';

type Data = {
  op: number;
  id: string;
  d: {
    event_ts: string;
    plain_token: string;
  };
  t: string;
};

const normalizeGatewayMessage = <T extends { id?: string; d?: Record<string, unknown> }>(message: T): T => {
  if (!message?.id || !message?.d || typeof message.d !== 'object' || Array.isArray(message.d)) {
    return message;
  }

  if ((message as T & { t?: string }).t === 'INTERACTION_CREATE') {
    message.d.event_id = message.id;
  }
  if (message.d.id === undefined || message.d.id === null || message.d.id === '') {
    message.d.id = message.id;
  }

  return message;
};

export class QQBotClient extends QQBotAPI {
  #events: {
    [K in keyof QQBotEventMap]?: ((event: QQBotEventMap[K]) => any)[];
  } = {};
  #app: Koa<Koa.DefaultState, Koa.DefaultContext> | null = null;
  #count = 0;
  #client: {
    id: string;
    ws: WebSocket;
  }[] = [];
  #ws: WebSocket | null = null;

  /**
   * 设置配置
   * @param opstion
   */
  constructor(opstion: Options) {
    super({ ...opstion });
  }

  /**
   * 注册事件处理程序
   * @param key 事件名称
   * @param val 事件处理函数
   */
  on<T extends keyof QQBotEventMap>(key: T, val: (event: QQBotEventMap[T]) => any) {
    if (!this.#events[key]) {
      this.#events[key] = [];
    }
    this.#events[key].push(val);

    return this;
  }

  /**
   * 定时鉴权
   * @param cfg
   * @returns
   */
  async #setTimeoutBotConfig() {
    const callBack = async () => {
      const app_id = this.config.get('app_id');
      const secret = this.config.get('secret');

      if (!app_id || !secret) {
        return;
      }
      // 发送请求
      const data: {
        access_token: string;
        expires_in: number;
        cache: boolean;
      } = await this.getAuthentication();

      this.config.set('access_token', data.access_token);
      console.info('refresh', data.expires_in, 's');
      setTimeout(() => void callBack(), data.expires_in * 1000);
    };

    await callBack();
  }

  /**
   *
   * @param cfg
   * @param conversation
   */
  connect() {
    try {
      const ws = this.config.get('ws');

      this.updateConnectionStatus({ state: 'connecting', transport: ws ? 'proxy' : 'webhook' });

      if (!ws) {
        void this.#setTimeoutBotConfig();
        this.#app = new Koa();
        this.#app.use(
          bodyParser({
            enableTypes: ['json'],
            onerror: (_error, ctx) => {
              ctx.status = 400;
              ctx.body = { msg: 'invalid json' };
            }
          })
        );
        const router = new Router();
        const port = this.config.get('port');
        const secret = this.config.get('secret');
        const route = this.config.get('route') ?? '/webhook';
        const cfg = {
          secret: secret ?? '',
          port: port ? Number(port) : 17157
        };
        const ntqqWebhook = new WebhookAPI({
          secret: cfg.secret
        });

        // 启动服务
        router.post(route, ctx => {
          // koa-bodyparser retains the original JSON text. The request stream
          // has already ended here; listening again cannot recover its bytes.
          const request = ctx.request as typeof ctx.request & { body: Data; rawBody?: string };
          const body = request.body;

          if (!body || typeof body !== 'object' || Array.isArray(body) || !Number.isInteger(body.op)) {
            ctx.status = 400;
            ctx.body = { msg: 'invalid payload' };

            return;
          }
          // Callback URL validation precedes signed event delivery, as in the
          // official SDK. Only op:13 may omit signature headers.
          if (body.op !== 13 && !ntqqWebhook.validSign(ctx.get('x-signature-timestamp'), request.rawBody, ctx.get('x-signature-ed25519'))) {
            ctx.status = 400;
            ctx.body = { msg: 'invalid signature' };

            return;
          }
          if (body.op === 13) {
            if (typeof body.d?.plain_token !== 'string' || !body.d.plain_token || typeof body.d?.event_ts !== 'string' || !body.d.event_ts) {
              ctx.status = 400;
              ctx.body = { msg: 'invalid validation' };

              return;
            }
            ctx.status = 200;
            ctx.body = {
              // 返回明文 token
              plain_token: body.d.plain_token,
              // 生成签名
              signature: ntqqWebhook.getSign(body.d.event_ts, body.d.plain_token)
            };
          } else if (body.op === 0) {
            if (typeof body.t !== 'string' || !body.t || !body.d || typeof body.d !== 'object' || Array.isArray(body.d)) {
              ctx.status = 400;
              ctx.body = { msg: 'invalid dispatch' };

              return;
            }
            normalizeGatewayMessage(body);
            ctx.status = 204;
            // 根据事件类型，处理事件
            this.#dispatch(body);
            const accessToken = this.config.get('access_token');

            // 也可以分法到客户端。 发送失败需要处理 或清理调
            for (const client of this.#client) {
              try {
                if (accessToken) {
                  body['access_token'] = accessToken;
                }
                client.ws.send(JSON.stringify(body));
              } catch (e) {
                this.#error(e);
              }
            }
          }
        });
        this.#app.use(router.routes());
        this.#app.use(router.allowedMethods());
        // 启动服务
        const server = this.#app.listen(cfg.port, () => {
          console.log('Server running at http://localhost:' + cfg.port + route);
          this.updateConnectionStatus({ state: 'ready' });
        });
        // 创建 WebSocketServer 并监听同一个端口
        const wss = new WebSocketServer({ server: server });

        console.log('Server running at ws://localhost:' + cfg.port + '/');
        // 处理客户端连接
        wss.on('connection', ws => {
          const clientId = uuidv4();

          ws['clientId'] = clientId;
          console.log(clientId, 'connection');
          this.#client.push({ id: clientId, ws });
          // 处理消息事件
          ws.on('message', (message: string) => {
            // 拿到消息
            try {
              const body = normalizeGatewayMessage(JSON.parse(message.toString()) as Data);

              this.#dispatch(body);
            } catch (e) {
              this.#error(e);
            }
          });
          // 处理关闭事件
          ws.on('close', () => {
            console.log(`${clientId} disconnected`);
            this.#client = this.#client.filter(client => client.id !== clientId);
          });
        });
      } else {
        const reConnect = () => {
          // 使用了ws服务器
          this.#ws = new WebSocket(ws);
          this.#ws.on('open', () => {
            this.#count = 0;
            this.updateConnectionStatus({ state: 'ready' });
            console.log('ws connected');
          });
          this.#ws.on('message', data => {
            try {
              // 拿到消息
              const body = normalizeGatewayMessage(JSON.parse(data.toString()) as Data);
              const accessToken = body['access_token'];

              if (accessToken) {
                this.config.set('access_token', accessToken);
              }
              this.#dispatch(body);
            } catch (e) {
              this.#error(e);
            }
          });
          this.#ws.on('close', () => {
            this.updateConnectionStatus({ state: 'offline' });
            console.log('ws closed');
            // 重连5次，超过5次不再重连
            if (this.#count > 5) {
              return;
            }
            // 1.3s 后重连
            setTimeout(() => {
              reConnect();
            }, 1300);
          });
          this.#ws.on('error', e => {
            this.#error(e);
          });
        };

        reConnect();
      }
    } catch (e) {
      this.#error(e);
    }
  }

  /** Acknowledge receipt without waiting for application work. Each listener
   * owns its failure path so a rejection cannot escape the transport. */
  #dispatch(body: Data) {
    for (const event of this.#events[body.t] || []) {
      void Promise.resolve()
        .then(() => event(body.d))
        .catch(error => this.#error(error));
    }
  }

  /**
   *
   * @param error
   */
  #error(error) {
    for (const event of this.#events['ERROR'] || []) {
      void Promise.resolve()
        .then(() => event(error))
        .catch(failure => console.error('[qq-bot] ERROR listener failed', failure instanceof Error ? failure.name : 'UnknownError'));
    }
  }
}
