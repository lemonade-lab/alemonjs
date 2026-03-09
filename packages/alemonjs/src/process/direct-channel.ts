/**
 * 直连通道 — 平台子进程 ↔ 客户端子进程直接通过 Unix Domain Socket 通讯
 * 完全绕过主进程，消除桥接跳转开销
 *
 * 协议：4字节大端长度前缀 + V8 序列化数据
 * 传输层：Unix Domain Socket（macOS/Linux）/ Named Pipe（Windows）
 */
import * as net from 'net';
import * as v8 from 'v8';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

/**
 * 生成唯一的 Socket 路径（跨平台）
 */
export const generateSocketPath = (): string => {
  if (process.platform === 'win32') {
    return `\\\\.\\pipe\\alemon-direct-${process.pid}-${Date.now()}`;
  }

  return path.join(os.tmpdir(), `alemon-direct-${process.pid}-${Date.now()}.sock`);
};

/**
 * 消息编码：4字节长度前缀 + V8 序列化数据（单次分配，零拷贝）
 */
const encodeMessage = (data: any): Buffer => {
  const serialized = v8.serialize(data);
  const buf = Buffer.allocUnsafe(4 + serialized.length);

  buf.writeUInt32BE(serialized.length, 0);
  serialized.copy(buf, 4);

  return buf;
};

/**
 * 创建流式消息解析器（处理粘包/拆包，优化 Buffer 分配）
 */
const createMessageParser = (onMessage: (data: any) => void) => {
  let buffer: Buffer<ArrayBufferLike> = Buffer.alloc(0);

  return (chunk: Buffer) => {
    // 优化：如果 buffer 为空，直接使用 chunk 避免 concat
    buffer = buffer.length === 0 ? chunk : Buffer.concat([buffer, chunk]);

    while (buffer.length >= 4) {
      const msgLen = buffer.readUInt32BE(0);
      const totalLen = 4 + msgLen;

      if (buffer.length < totalLen) {
        break;
      }

      const msgBuf = buffer.subarray(4, totalLen);

      buffer = buffer.subarray(totalLen);

      try {
        onMessage(v8.deserialize(msgBuf));
      } catch {
        // 反序列化失败，跳过该消息
      }
    }
  };
};

export interface DirectChannel {
  send: (data: any) => void;
  close: () => void;
}

/**
 * 创建直连服务端（客户端子进程调用）
 * 在 Unix Domain Socket 上监听，等待平台子进程直连
 */
export const createDirectServer = (sockPath: string, onMessage: (data: any) => void): Promise<DirectChannel> => {
  return new Promise((resolve, reject) => {
    let connection: net.Socket | null = null;

    // 清理可能残留的 socket 文件（子进程重启场景）
    if (process.platform !== 'win32') {
      try {
        fs.unlinkSync(sockPath);
      } catch {
        /* ignore */
      }
    }

    const server = net.createServer(socket => {
      // 新连接到来（平台子进程连接 / 重连）
      connection = socket;
      const parser = createMessageParser(onMessage);

      socket.on('data', parser);
      socket.on('error', () => {
        connection = null;
      });
      socket.on('close', () => {
        connection = null;
      });
    });

    const cleanup = () => {
      try {
        server.close();
        connection?.destroy();
        if (process.platform !== 'win32') {
          try {
            fs.unlinkSync(sockPath);
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }
    };

    process.on('exit', cleanup);

    server.listen(sockPath, () => {
      resolve({
        send: (data: any) => {
          if (connection && !connection.destroyed) {
            connection.write(encodeMessage(data));
          }
        },
        close: cleanup
      });
    });

    server.on('error', reject);
  });
};

/**
 * 创建直连客户端（平台子进程调用）
 * 连接到客户端子进程的 Unix Domain Socket，支持自动重试
 */
export const createDirectClient = (sockPath: string, onMessage: (data: any) => void, maxRetries = 30, retryDelay = 150): Promise<DirectChannel> => {
  let attempts = 0;

  const tryConnect = (): Promise<DirectChannel> => {
    return new Promise<DirectChannel>((resolve, reject) => {
      const parser = createMessageParser(onMessage);

      const socket = net.createConnection(sockPath, () => {
        resolve({
          send: (data: any) => {
            if (!socket.destroyed) {
              socket.write(encodeMessage(data));
            }
          },
          close: () => {
            socket.destroy();
          }
        });
      });

      socket.on('data', parser);
      socket.on('error', reject);
    }).catch(err => {
      if (++attempts < maxRetries) {
        return new Promise<DirectChannel>(r => setTimeout(() => r(tryConnect()), retryDelay));
      }
      throw err;
    });
  };

  return tryConnect();
};
