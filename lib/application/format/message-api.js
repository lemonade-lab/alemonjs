import { logger } from "../../common/logger.js";
import { ResultCode } from "../../common/variable.js";
import { translate } from "../../common/i18n.js";
import { createResult } from "../../common/result.js";
import "../../common/index.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import { markEventSendAttempt, markEventSendFailure, recordEventSendResults } from "../runtime/hook-event-context.js";

//#region src/application/format/message-api.ts
/**
* 创建数据格式。
* @param {...DataEnums[]} data - 要格式化的数据。
* @returns {DataEnums[]} - 返回格式化后的数据数组。
* @throws {Error} - 如果 data 无效，抛出错误。
* @deprecated 废弃，请使用 Format
*/
const format = (...data) => {
	if (!data || data.length === 0) {
		logger.error({
			code: ResultCode.FailParams,
			message: "Invalid data: data cannot be empty",
			data: null
		});
		throw new Error("Invalid data: data cannot be empty");
	}
	return data;
};
global.format = format;
/**
* 创建数据格式。
* @param {...DataEnums[]} data - 要格式化的数据。
* @returns {DataEnums[]} - 返回格式化后的数据数组。
* @throws {Error} - 如果 data 无效，抛出错误。
* @deprecated 废弃，请使用 format
*/
const createDataFormat = format;
/**
* 主动消息 API
*/
var MessageDirect = class MessageDirect {
	static create() {
		return new MessageDirect();
	}
	/**
	* 发送到频道
	* @param params
	*/
	async sendToChannel(params) {
		if (!params.SpaceId || typeof params.SpaceId !== "string") {
			logger.error({
				code: ResultCode.FailParams,
				message: "Invalid SpaceId: SpaceId must be a string",
				data: null
			});
			throw new Error("Invalid SpaceId: SpaceId must be a string");
		}
		markEventSendAttempt();
		try {
			const results = await sendAction({
				action: "message.send.channel",
				payload: {
					ChannelId: params.SpaceId,
					BotId: params.BotId,
					params: {
						format: Array.isArray(params.format) ? params.format : params.format.value,
						replyId: params?.replyId
					}
				}
			});
			recordEventSendResults(results, void 0);
			return results;
		} catch (error) {
			markEventSendFailure(error);
			throw error;
		}
	}
	/**
	* 私信
	* @param params
	*/
	async sendToUser(params) {
		if (!params.OpenID || typeof params.OpenID !== "string") {
			logger.error({
				code: ResultCode.FailParams,
				message: "Invalid OpenID: OpenID must be a string",
				data: null
			});
			throw new Error("Invalid OpenID: OpenID must be a string");
		}
		markEventSendAttempt();
		try {
			const results = await sendAction({
				action: "message.send.user",
				payload: {
					UserId: params.OpenID,
					BotId: params.BotId,
					params: { format: Array.isArray(params.format) ? params.format : params.format.value }
				}
			});
			recordEventSendResults(results, void 0);
			return results;
		} catch (error) {
			markEventSendFailure(error);
			throw error;
		}
	}
	/**
	* Send to an explicitly scoped destination. Prefer this for group/C2C
	* platforms where the destination identifier is not a channel or user ID.
	*/
	async sendToTarget(params) {
		if (!params.target?.targetId) throw new Error("Invalid targetId: targetId must be a non-empty string");
		markEventSendAttempt();
		try {
			const results = await sendAction({
				action: "message.send.target",
				payload: {
					target: params.target,
					params: {
						format: Array.isArray(params.format) ? params.format : params.format.value,
						replyId: params.replyId
					}
				}
			});
			recordEventSendResults(results, void 0);
			return results;
		} catch (error) {
			markEventSendFailure(error);
			throw error;
		}
	}
};
/**
* 向指定频道发送消息。
* @param {string} SpaceId - 空间ID，可能是服务器ID、频道ID、群ID、聊天ID，或者是复合ID。总之，是框架给指定空间的唯一标识。也就是说，不能使用ChannelId作为该参数。
* @param {DataEnums[]} data - 要发送的数据。
* @throws {Error} - 如果 SpaceId 无效或发送失败，抛出错误。
* @deprecated 废弃，推荐使用 MessageDirect.create().sendToChannel()
*/
const sendToChannel = (SpaceId, data) => {
	return MessageDirect.create().sendToChannel({
		SpaceId,
		format: data,
		replyId: void 0
	});
};
/**
* 向指定用户发送消息。
* @param {string} OpenID - 开放ID，可能是用户ID、聊天ID，或是复合ID。总之，是框架给指定用户的唯一标识。也就说，不能使用UserId作为该参数。
* @param {DataEnums[]} data - 要发送的数据。
* @throws {Error} - 如果 user_id 无效或发送失败，抛出错误。
* @deprecated 废弃，推荐使用 MessageDirect.create().sendToUser()
*/
const sendToUser = (OpenID, data) => {
	return MessageDirect.create().sendToUser({
		OpenID,
		format: data
	});
};
/**
* 得到消息意图。
* 用于多平台下的降级消费。
* @deprecated 试验性功能，请勿使用
* @param event
* @param data
* @returns
*/
const getMessageIntent = async () => {
	const results = await sendAction({
		action: "message.intent",
		payload: {}
	});
	return createResult(ResultCode.Ok, translate("result.retrieved.successfully"), results[0]?.data ?? null);
};

//#endregion
export { MessageDirect, createDataFormat, format, getMessageIntent, sendToChannel, sendToUser };