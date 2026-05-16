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
import * as flatted from 'flatted';

export const generateSocketPath = (): string => {
  if (process.platform === 'win32') {
    return `\\\\.\\pipe\\alemon-direct-${process.pid}-${Date.now()}`;
  }

  return path.join(os.tmpdir(), `alemon-direct-${process.pid}-${Date.now()}.sock`);
};

const encodeMessage = (data: any): Buffer => {
  const safeData = flatted.parse(flatted.stringify(data));
  const serialized = v8.serialize(safeData);
  const buf = Buffer.allocUnsafe(4 + serialized.length);

  buf.writeUInt32BE(serialized.length, 0);
  serialized.copy(buf, 4);

  return buf;
};

const createMessageParser = (onMessage: (data: any) => void) => {
  let buffer: Buffer<ArrayBufferLike> = Buffer.alloc(0);

  return (chunk: Buffer) => {
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
        // ignore broken frames
      }
    }
  };
};

export interface DirectChannel {
  send: (data: any) => void;
  close: () => void;
}

export const createDirectServer = (sockPath: string, onMessage: (data: any) => void): Promise<DirectChannel> => {
  return new Promise((resolve, reject) => {
    let connection: net.Socket | null = null;

    if (process.platform !== 'win32') {
      try {
        fs.unlinkSync(sockPath);
      } catch {
        // ignore
      }
    }

    const server = net.createServer(socket => {
      connection = socket;
      const parser = createMessageParser(onMessage);

      socket.on('data', parser);
      socket.on('error', () => {
        if (connection === socket) {
          connection = null;
        }
      });
      socket.on('close', () => {
        if (connection === socket) {
          connection = null;
        }
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
            // ignore
          }
        }
      } catch {
        // ignore
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

export const createDirectClient = (sockPath: string, onMessage: (data: any) => void, maxRetries = 30, retryDelay = 150): Promise<DirectChannel> => {
  let attempts = 0;

  const tryConnect = (): Promise<DirectChannel> => {
    return new Promise<DirectChannel>((resolve, reject) => {
      const parser = createMessageParser(onMessage);

      const socket = net.createConnection(sockPath, () => {
        socket.removeListener('error', reject);
        socket.on('error', () => {
          // ignore runtime socket errors
        });
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
