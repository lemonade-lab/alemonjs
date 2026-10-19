import { __exportAll } from "../_virtual/_rolldown/runtime.js";
import { Logger, logger, shutdownLogger } from "./logger.js";
import { EventMessageText, Fail, FailAuth, FailInternal, FailParams, Ok, ResultCode, Warn, defaultLogin, defaultPlatformCommonPrefix, defaultPlatformPrefix, defaultPort, filePrefixCommon, fileSuffixMiddleware, fileSuffixResponse, processorMaxMapSize, processorRepeatedClearSize, processorRepeatedClearTimeMax, processorRepeatedClearTimeMin, processorRepeatedEventTime, processorRepeatedUserTime } from "./variable.js";
import { getConfig, getConfigValue, onWatchConfigValue } from "./config.js";
import { getLanguage, translate, withLanguage } from "./i18n.js";
import { createUserHashKey, fastHash, isMaster, matchIn, useUserHashKey } from "./identity.js";
import { createResult } from "./result.js";
import { SinglyLinkedList } from "./SinglyLinkedList.js";
import { createEventName, createHash, getCachedRegExp, getInputExportPath, getRecursiveDirFiles, sanitizeForSerialization, showErrorModule, stringToNumber } from "./utils.js";
import { createDirectClient, createDirectServer, generateSocketPath } from "./direct-channel.js";
import { A, Body, Component, DOCTYPE, Div, H1, Head, Html, P, Style, Title, createElement, renderToString } from "./react.js";
import { DEVICE_ID_HEADER, FULL_RECEIVE_HEADER, HEARTBEAT_INTERVAL, USER_AGENT_HEADER, USER_AGENT_HEADER_VALUE_MAP, reconnectInterval, timeoutTime } from "./cbp/constants.js";
import { deviceId, generateUniqueId } from "./cbp/runtime.js";
import { useHeartbeat } from "./cbp/heartbeat.js";
import { createWSConnector } from "./cbp/ws-connector.js";
import { createActionRequestEnvelope, createActionResponseEnvelope, createApiRequestEnvelope, createApiResponseEnvelope, createEventEnvelope, getNormalizedDeviceId, getNormalizedEventRouteId, isCBPEnvelope, isNormalizedActionRequest, isNormalizedApiRequest, normalizeInboundMessage, toLegacyActionData, toLegacyApiData } from "./cbp/normalize.js";

//#region src/common/index.ts
var common_exports = /* @__PURE__ */ __exportAll({
	A: () => A,
	Body: () => Body,
	Component: () => Component,
	DEVICE_ID_HEADER: () => DEVICE_ID_HEADER,
	DOCTYPE: () => DOCTYPE,
	Div: () => Div,
	EventMessageText: () => EventMessageText,
	FULL_RECEIVE_HEADER: () => FULL_RECEIVE_HEADER,
	Fail: () => Fail,
	FailAuth: () => FailAuth,
	FailInternal: () => FailInternal,
	FailParams: () => FailParams,
	H1: () => H1,
	HEARTBEAT_INTERVAL: () => HEARTBEAT_INTERVAL,
	Head: () => Head,
	Html: () => Html,
	Logger: () => Logger,
	Ok: () => Ok,
	P: () => P,
	ResultCode: () => ResultCode,
	SinglyLinkedList: () => SinglyLinkedList,
	Style: () => Style,
	Title: () => Title,
	USER_AGENT_HEADER: () => USER_AGENT_HEADER,
	USER_AGENT_HEADER_VALUE_MAP: () => USER_AGENT_HEADER_VALUE_MAP,
	Warn: () => Warn,
	createActionRequestEnvelope: () => createActionRequestEnvelope,
	createActionResponseEnvelope: () => createActionResponseEnvelope,
	createApiRequestEnvelope: () => createApiRequestEnvelope,
	createApiResponseEnvelope: () => createApiResponseEnvelope,
	createDirectClient: () => createDirectClient,
	createDirectServer: () => createDirectServer,
	createElement: () => createElement,
	createEventEnvelope: () => createEventEnvelope,
	createEventName: () => createEventName,
	createHash: () => createHash,
	createResult: () => createResult,
	createUserHashKey: () => createUserHashKey,
	createWSConnector: () => createWSConnector,
	defaultLogin: () => "gui",
	defaultPlatformCommonPrefix: () => defaultPlatformCommonPrefix,
	defaultPlatformPrefix: () => defaultPlatformPrefix,
	defaultPort: () => defaultPort,
	deviceId: () => deviceId,
	fastHash: () => fastHash,
	filePrefixCommon: () => filePrefixCommon,
	fileSuffixMiddleware: () => fileSuffixMiddleware,
	fileSuffixResponse: () => fileSuffixResponse,
	generateSocketPath: () => generateSocketPath,
	generateUniqueId: () => generateUniqueId,
	getCachedRegExp: () => getCachedRegExp,
	getConfig: () => getConfig,
	getConfigValue: () => getConfigValue,
	getInputExportPath: () => getInputExportPath,
	getLanguage: () => getLanguage,
	getNormalizedDeviceId: () => getNormalizedDeviceId,
	getNormalizedEventRouteId: () => getNormalizedEventRouteId,
	getRecursiveDirFiles: () => getRecursiveDirFiles,
	isCBPEnvelope: () => isCBPEnvelope,
	isMaster: () => isMaster,
	isNormalizedActionRequest: () => isNormalizedActionRequest,
	isNormalizedApiRequest: () => isNormalizedApiRequest,
	logger: () => logger,
	matchIn: () => matchIn,
	normalizeInboundMessage: () => normalizeInboundMessage,
	onWatchConfigValue: () => onWatchConfigValue,
	processorMaxMapSize: () => processorMaxMapSize,
	processorRepeatedClearSize: () => 37,
	processorRepeatedClearTimeMax: () => processorRepeatedClearTimeMax,
	processorRepeatedClearTimeMin: () => processorRepeatedClearTimeMin,
	processorRepeatedEventTime: () => processorRepeatedEventTime,
	processorRepeatedUserTime: () => processorRepeatedUserTime,
	reconnectInterval: () => reconnectInterval,
	renderToString: () => renderToString,
	sanitizeForSerialization: () => sanitizeForSerialization,
	showErrorModule: () => showErrorModule,
	shutdownLogger: () => shutdownLogger,
	stringToNumber: () => stringToNumber,
	timeoutTime: () => timeoutTime,
	toLegacyActionData: () => toLegacyActionData,
	toLegacyApiData: () => toLegacyApiData,
	translate: () => translate,
	useHeartbeat: () => useHeartbeat,
	useUserHashKey: () => useUserHashKey,
	withLanguage: () => withLanguage
});

//#endregion
export { A, Body, Component, DEVICE_ID_HEADER, DOCTYPE, Div, EventMessageText, FULL_RECEIVE_HEADER, Fail, FailAuth, FailInternal, FailParams, H1, HEARTBEAT_INTERVAL, Head, Html, Logger, Ok, P, ResultCode, SinglyLinkedList, Style, Title, USER_AGENT_HEADER, USER_AGENT_HEADER_VALUE_MAP, Warn, common_exports, createActionRequestEnvelope, createActionResponseEnvelope, createApiRequestEnvelope, createApiResponseEnvelope, createDirectClient, createDirectServer, createElement, createEventEnvelope, createEventName, createHash, createResult, createUserHashKey, createWSConnector, defaultLogin, defaultPlatformCommonPrefix, defaultPlatformPrefix, defaultPort, deviceId, fastHash, filePrefixCommon, fileSuffixMiddleware, fileSuffixResponse, generateSocketPath, generateUniqueId, getCachedRegExp, getConfig, getConfigValue, getInputExportPath, getLanguage, getNormalizedDeviceId, getNormalizedEventRouteId, getRecursiveDirFiles, isCBPEnvelope, isMaster, isNormalizedActionRequest, isNormalizedApiRequest, logger, matchIn, normalizeInboundMessage, onWatchConfigValue, processorMaxMapSize, processorRepeatedClearSize, processorRepeatedClearTimeMax, processorRepeatedClearTimeMin, processorRepeatedEventTime, processorRepeatedUserTime, reconnectInterval, renderToString, sanitizeForSerialization, showErrorModule, shutdownLogger, stringToNumber, timeoutTime, toLegacyActionData, toLegacyApiData, translate, useHeartbeat, useUserHashKey, withLanguage };