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
  /** Returns whether the frame was accepted by the local socket. */
  send: (data: any) => boolean;
  close: () => void;
}

const sendMessage = (socket: net.Socket | null, data: any): boolean => {
  if (!socket?.writable || socket.destroyed || socket.connecting) {
    return false;
  }

  // write() returning false signals backpressure, not a rejected frame.
  socket.write(encodeMessage(data));

  return true;
};

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
      process.off('exit', cleanup);
      try {
        server.close();
        connection?.destroy();
      } catch {
        // ignore
      }
    };

    server.listen(sockPath, () => {
      process.once('exit', cleanup);
      resolve({
        send: data => sendMessage(connection, data),
        close: cleanup
      });
    });

    server.on('error', reject);
  });
};

export const createDirectClient = (sockPath: string, onMessage: (data: any) => void, maxAttempts = 30, retryDelay = 150): Promise<DirectChannel> => {
  return new Promise((resolve, reject) => {
    let connection: net.Socket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let closed = false;
    let connectedOnce = false;
    let startupAttempts = 0;
    let reconnectDelay = retryDelay;
    const channel: DirectChannel = {
      send: data => sendMessage(connection, data),
      close: () => {
        closed = true;
        clearTimeout(retryTimer);
        connection?.destroy();
        connection = null;
      }
    };

    const connect = () => {
      let connectionError: Error | undefined;
      const socket = net.createConnection(sockPath);

      socket.once('connect', () => {
        reconnectDelay = retryDelay;
        if (!connectedOnce) {
          connectedOnce = true;
          resolve(channel);
        }
      });
      socket.on('data', createMessageParser(onMessage));
      socket.on('error', error => {
        connectionError = error;
      });
      socket.once('close', () => {
        connection = null;
        if (closed) {
          return;
        }
        if (!connectedOnce && ++startupAttempts >= maxAttempts) {
          reject(connectionError ?? new Error('Direct-IPC closed before connecting'));

          return;
        }
        // The module can restart independently. Once connected, keep trying
        // until a replacement listener is available or the channel is closed.
        retryTimer = setTimeout(connect, reconnectDelay);
        if (connectedOnce) {
          reconnectDelay = Math.min(reconnectDelay * 2, Math.max(retryDelay, 1000));
        }
      });
      // Keep the in-progress socket reachable so close() can cancel a retry.
      connection = socket;
    };

    connect();
  });
};
