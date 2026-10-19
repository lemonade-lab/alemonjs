import * as fs$1 from "fs";
import * as path$1 from "path";
import * as net from "net";
import * as v8 from "v8";
import * as os from "os";
import * as flatted from "flatted";

//#region src/common/direct-channel.ts
/**
* 直连通道 — 平台子进程 ↔ 客户端子进程直接通过 Unix Domain Socket 通讯
* 完全绕过主进程，消除桥接跳转开销
*
* 协议：4字节大端长度前缀 + V8 序列化数据
* 传输层：Unix Domain Socket（macOS/Linux）/ Named Pipe（Windows）
*/
const generateSocketPath = () => {
	if (process.platform === "win32") return `\\\\.\\pipe\\alemon-direct-${process.pid}-${Date.now()}`;
	return path$1.join(os.tmpdir(), `alemon-direct-${process.pid}-${Date.now()}.sock`);
};
const encodeMessage = (data) => {
	const safeData = flatted.parse(flatted.stringify(data));
	const serialized = v8.serialize(safeData);
	const buf = Buffer.allocUnsafe(4 + serialized.length);
	buf.writeUInt32BE(serialized.length, 0);
	serialized.copy(buf, 4);
	return buf;
};
const createMessageParser = (onMessage) => {
	let buffer = Buffer.alloc(0);
	return (chunk) => {
		buffer = buffer.length === 0 ? chunk : Buffer.concat([buffer, chunk]);
		while (buffer.length >= 4) {
			const totalLen = 4 + buffer.readUInt32BE(0);
			if (buffer.length < totalLen) break;
			const msgBuf = buffer.subarray(4, totalLen);
			buffer = buffer.subarray(totalLen);
			try {
				onMessage(v8.deserialize(msgBuf));
			} catch {}
		}
	};
};
const createDirectServer = (sockPath, onMessage) => {
	return new Promise((resolve, reject) => {
		let connection = null;
		if (process.platform !== "win32") try {
			fs$1.unlinkSync(sockPath);
		} catch {}
		const server = net.createServer((socket) => {
			connection = socket;
			const parser = createMessageParser(onMessage);
			socket.on("data", parser);
			socket.on("error", () => {
				if (connection === socket) connection = null;
			});
			socket.on("close", () => {
				if (connection === socket) connection = null;
			});
		});
		const cleanup = () => {
			try {
				server.close();
				connection?.destroy();
				if (process.platform !== "win32") try {
					fs$1.unlinkSync(sockPath);
				} catch {}
			} catch {}
		};
		process.on("exit", cleanup);
		server.listen(sockPath, () => {
			resolve({
				send: (data) => {
					if (connection && !connection.destroyed) connection.write(encodeMessage(data));
				},
				close: cleanup
			});
		});
		server.on("error", reject);
	});
};
const createDirectClient = (sockPath, onMessage, maxRetries = 30, retryDelay = 150) => {
	let attempts = 0;
	const tryConnect = () => {
		return new Promise((resolve, reject) => {
			const parser = createMessageParser(onMessage);
			const socket = net.createConnection(sockPath, () => {
				socket.removeListener("error", reject);
				socket.on("error", () => {});
				resolve({
					send: (data) => {
						if (!socket.destroyed) socket.write(encodeMessage(data));
					},
					close: () => {
						socket.destroy();
					}
				});
			});
			socket.on("data", parser);
			socket.on("error", reject);
		}).catch((err) => {
			if (++attempts < maxRetries) return new Promise((r) => setTimeout(() => r(tryConnect()), retryDelay));
			throw err;
		});
	};
	return tryConnect();
};

//#endregion
export { createDirectClient, createDirectServer, generateSocketPath };