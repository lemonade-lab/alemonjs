import { ResultCode } from "../../../common/variable.js";
import "../../../common/index.js";
import { existsSync, mkdirSync, readFileSync, watch, writeFile } from "fs";
import { dirname, join } from "path";
import * as flattedJSON from "flatted";
import { debounce } from "lodash-es";
import { readFile } from "fs/promises";

//#region src/core/cbp/server/testone.ts
/**
* @param ws
* @param request
*/
const createTestOneController = (ws, _request) => {
	const testonePath = join(process.cwd(), "testone");
	if (!existsSync(testonePath)) mkdirSync(testonePath, { recursive: true });
	const dirWatcher = watch(testonePath, { persistent: true }, (eventType, filename) => {
		if (!filename) return;
		if (eventType === "change") {
			if (filename === "commands.json") onCommands();
			else if (filename === "users.json") onUsers();
			else if (filename === "channels.json") onChannels();
			else if (filename === "user.json") onUser();
			else if (filename === "bot.json") onBot();
		}
	});
	const commandsPath = join(testonePath, "commands.json");
	const onCommands = debounce(() => {
		if (!existsSync(commandsPath)) return;
		readFile(commandsPath, "utf-8").then((data) => {
			const commands = JSON.parse(data);
			ws?.send(flattedJSON.stringify({
				type: "commands",
				payload: commands
			}));
		}).catch((error) => {
			logger.error({
				code: ResultCode.Fail,
				message: "读取 commands.json 失败",
				data: error
			});
		});
	}, 1e3);
	const usersPath = join(testonePath, "users.json");
	const onUsers = debounce(() => {
		if (!existsSync(usersPath)) return;
		readFile(usersPath, "utf-8").then((data) => {
			const users = JSON.parse(data);
			ws?.send(flattedJSON.stringify({
				type: "users",
				payload: users
			}));
		}).catch((error) => {
			logger.error({
				code: ResultCode.Fail,
				message: "读取 users.json 失败",
				data: error
			});
		});
	}, 1e3);
	const channelsPath = join(testonePath, "channels.json");
	const onChannels = debounce(() => {
		if (!existsSync(channelsPath)) return;
		readFile(channelsPath, "utf-8").then((data) => {
			const channels = JSON.parse(data);
			ws?.send(flattedJSON.stringify({
				type: "channels",
				payload: channels
			}));
		}).catch((error) => {
			logger.error({
				code: ResultCode.Fail,
				message: "读取 channels.json 失败",
				data: error
			});
		});
	}, 1e3);
	const userPath = join(testonePath, "user.json");
	const onUser = debounce(() => {
		if (!existsSync(userPath)) return;
		readFile(userPath, "utf-8").then((data) => {
			const user = JSON.parse(data);
			ws?.send(flattedJSON.stringify({
				type: "user",
				payload: user
			}));
		}).catch((error) => {
			logger.error({
				code: ResultCode.Fail,
				message: "读取 user.json 失败",
				data: error
			});
		});
	}, 1e3);
	const botPath = join(testonePath, "bot.json");
	const onBot = debounce(() => {
		if (!existsSync(botPath)) return;
		readFile(botPath, "utf-8").then((data) => {
			const bot = JSON.parse(data);
			ws?.send(flattedJSON.stringify({
				type: "bot",
				payload: bot
			}));
		}).catch((error) => {
			logger.error({
				code: ResultCode.Fail,
				message: "读取 bot.json 失败",
				data: error
			});
		});
	}, 1e3);
	const privateMessagePath = join(testonePath, ".cache", "private.message.json");
	const publicMessagePath = join(testonePath, ".cache", "public.message.json");
	const cacheDir = dirname(privateMessagePath);
	mkdirSync(cacheDir, { recursive: true });
	const initData = () => {
		try {
			const commandsData = existsSync(commandsPath) ? JSON.parse(readFileSync(commandsPath, "utf-8")) : [];
			const usersData = existsSync(usersPath) ? JSON.parse(readFileSync(usersPath, "utf-8")) : [];
			const channelsData = existsSync(channelsPath) ? JSON.parse(readFileSync(channelsPath, "utf-8")) : [];
			const userData = existsSync(userPath) ? JSON.parse(readFileSync(userPath, "utf-8")) : null;
			const botData = existsSync(botPath) ? JSON.parse(readFileSync(botPath, "utf-8")) : null;
			const privateMessage = existsSync(privateMessagePath) ? JSON.parse(readFileSync(privateMessagePath, "utf-8")) : [];
			const publicMessage = existsSync(publicMessagePath) ? JSON.parse(readFileSync(publicMessagePath, "utf-8")) : [];
			ws?.send(flattedJSON.stringify({
				type: "init.data",
				payload: {
					commands: commandsData,
					users: usersData,
					channels: channelsData,
					user: userData,
					bot: botData,
					privateMessage,
					publicMessage
				}
			}));
		} catch (error) {
			logger.error({
				code: ResultCode.Fail,
				message: "初始化数据失败",
				data: error
			});
		}
	};
	const onDeleteMessage = (type, CreateAt) => {
		const messagePath = type === "private" ? privateMessagePath : publicMessagePath;
		if (existsSync(messagePath)) try {
			const updatedMessages = JSON.parse(readFileSync(messagePath, "utf-8")).filter((msg) => msg.CreateAt !== CreateAt);
			writeFile(messagePath, JSON.stringify(updatedMessages, null, 2), (error) => {
				if (error) logger.error({
					code: ResultCode.Fail,
					message: `写入 ${type} 消息失败`,
					data: error
				});
			});
		} catch (error) {
			logger.error({
				code: ResultCode.Fail,
				message: `读取 ${type} 消息失败`,
				data: error
			});
		}
	};
	const onSaveMessage = (type, message) => {
		const messagePath = type === "private" ? privateMessagePath : publicMessagePath;
		const messages = existsSync(messagePath) ? JSON.parse(readFileSync(messagePath, "utf-8")) : [];
		messages.push(message);
		writeFile(messagePath, JSON.stringify(messages, null, 2), (error) => {
			if (error) logger.error({
				code: ResultCode.Fail,
				message: `写入 ${type} 消息失败`,
				data: error
			});
		});
	};
	return {
		onMessage: (parsedMessage) => {
			if (parsedMessage.type === "init.data") initData();
			else if (parsedMessage.type === "commands") onCommands();
			else if (parsedMessage.type === "users") onUsers();
			else if (parsedMessage.type === "channels") onChannels();
			else if (parsedMessage.type === "user") onUser();
			else if (parsedMessage.type === "bot") onBot();
			else if (parsedMessage.type === "private.message.delete") {
				const CreateAt = parsedMessage.payload.CreateAt;
				onDeleteMessage("private", CreateAt);
			} else if (parsedMessage.type === "public.message.delete") {
				const CreateAt = parsedMessage.payload.CreateAt;
				onDeleteMessage("public", CreateAt);
			} else if (parsedMessage.type === "private.message.save") onSaveMessage("private", parsedMessage.payload);
			else if (parsedMessage.type === "public.message.save") onSaveMessage("public", parsedMessage.payload);
		},
		close: () => {
			logger.info({
				code: ResultCode.Ok,
				message: "WebSocket connection closed",
				data: null
			});
			dirWatcher.close();
		},
		error: (err) => {
			logger.error({
				code: ResultCode.Fail,
				message: "WebSocket error:",
				data: err
			});
			dirWatcher.close();
		}
	};
};

//#endregion
export { createTestOneController };