import { __exportAll } from "../_virtual/_rolldown/runtime.js";
import { ActionsEventEnum } from "../types/event/actions.js";
import { defineChildren } from "./define-children.js";
import { defineResponse } from "./define-response.js";
import { defineMiddleware } from "./define-middleware.js";
import { defineRouter, lazy, runHandler } from "./define-router.js";
import { Expose, clearAllExpose, disposeExpose, registerExpose } from "./expose.js";
import { ChildrenApp, Core, Middleware, MiddlewareRouter, MiddlewareTree, ProcessorEventAutoClearMap, ProcessorEventUserAutoClearMap, Response, ResponseMiddleware, ResponseRouter, ResponseTree, State, StateSubscribe, SubscribeList, bumpStoreVersion, clearRuntimeAppKoaRouters, core, disposeAllRuntimeApps, disposeRuntimeApp, getChildrenApp, getRuntimeApp, getRuntimeAppKoaRouters, getSubscribeList, hasRuntimeAppCapability, listChildrenApps, listRuntimeAppKoaRouters, listRuntimeApps, registerRuntimeApp, setRuntimeAppKoaRouters, toRuntimeAppSnapshot, updateRuntimeAppCapabilities, updateRuntimeAppStatus } from "./runtime/store.js";
import { Format, FormatButtonGroup, FormatMarkDown, FormatSelect } from "./format/message-format.js";
import { finishCurrentTrace, getCurrentAppName, getCurrentEvent, getCurrentNext, getCurrentPhase, markEventSendAttempt, markEventSendFailure, markEventSendSuccess, onCurrentEventFinished, recordEventSendResults, withEventContext, withProcessorTrace } from "./runtime/hook-event-context.js";
import { useAnnounce } from "./hooks/announce.js";
import { useChannel } from "./hooks/channel.js";
import { useAudio, useChannelSettings, useForum, useSchedule } from "./hooks/channel-content.js";
import { useConnection } from "./hooks/connection.js";
import { useClient } from "./hooks/client.js";
import { useGuild } from "./hooks/guild.js";
import { useHistory } from "./hooks/history.js";
import { useInteraction } from "./hooks/interaction.js";
import { useMedia } from "./hooks/media.js";
import { useMe } from "./hooks/me.js";
import { useMember } from "./hooks/member.js";
import { useMention } from "./hooks/mention.js";
import { runWithTyping, startTypingIndicator } from "./typing.js";
import { useMessage, useSend, useSends } from "./hooks/message.js";
import { usePermission } from "./hooks/permission.js";
import { useReaction } from "./hooks/reaction.js";
import { useRequest } from "./hooks/request.js";
import { useRole } from "./hooks/role.js";
import { useRoute } from "./hooks/route.js";
import { useUser } from "./hooks/user.js";
import { useObserver, useSubscribe } from "./hooks/subscribe.js";
import { createEvent, useEvent } from "./hooks/event.js";
import { useMenu } from "./hooks/menu.js";
import { usePanel } from "./hooks/panel.js";
import "./hooks/index.js";
import { registerAppDir, scheduleCancel, scheduleCancelAll, scheduleCancelByApp, scheduleCron, scheduleInterval, scheduleList, schedulePause, scheduleResume, scheduleTimeout, unregisterAppDir } from "./runtime/schedule-store.js";
import { configureContext, createContext } from "./context.js";
import { clearInterval, clearTimeout, listSchedule, pauseSchedule, resumeSchedule, setCron, setInterval, setTimeout } from "./schedule.js";
import { MessageDirect, createDataFormat, format, getMessageIntent, sendToChannel, sendToUser } from "./format/message-api.js";
import { joinMarkdownParts, markdownToPlainText, renderMarkdownBlockquote } from "./format/markdown-render.js";
import { Attachment, Audio, BT, Button, Image, ImageFile, ImageURL, Link, MD, Markdown, MarkdownOriginal, Mention, Text, Video } from "./format/message-format-old.js";
import { normalizeRoutePath, parseMessageText } from "./router/parser.js";
import { checkFallbackHint } from "./router/fallback.js";
import { validateRouteArgs, validateRouteArgsForCommand } from "./router/validator.js";
import { Router } from "./router/dsl.js";
import "./router/main.js";
import { OnResponse, onResponse } from "./runtime/event-response.js";
import { OnMiddleware, onMiddleware } from "./runtime/event-middleware.js";
import { createSelects, onSelects, onState, unChildren, unState, useState } from "./runtime/event-utils.js";
import { onGroup } from "./runtime/event-group.js";
import { loadChildren, loadChildrenFile } from "./runtime/load-modules/loadChild.js";
import { loadModels, run } from "./runtime/load-modules/load.js";
import { MemoryConversationStore, conversationIdentity, createConversationService, formatConversationPrompt, useConversation } from "./conversation.js";
import { createRateLimiter } from "./rate-limit.js";
import { expendEvent } from "./runtime/event-processor-event.js";
import { expendMiddleware } from "./runtime/event-processor-middleware.js";
import { expendSubscribe, expendSubscribeCreate, expendSubscribeMount, expendSubscribeUnmount } from "./runtime/event-processor-subscribe.js";
import { expendCycle } from "./runtime/event-processor-cycle.js";
import { OnProcessor, onProcessor } from "./runtime/event-processor.js";
import { cbpClient } from "./runtime/cbp/connects/client.js";
import "./runtime/cbp/index.js";

//#region src/application/index.ts
var application_exports = /* @__PURE__ */ __exportAll({
	ActionsEventEnum: () => ActionsEventEnum,
	Attachment: () => Attachment,
	Audio: () => Audio,
	BT: () => BT,
	Button: () => Button,
	ChildrenApp: () => ChildrenApp,
	Core: () => Core,
	Expose: () => Expose,
	Format: () => Format,
	FormatButtonGroup: () => FormatButtonGroup,
	FormatMarkDown: () => FormatMarkDown,
	FormatSelect: () => FormatSelect,
	Image: () => Image,
	ImageFile: () => ImageFile,
	ImageURL: () => ImageURL,
	Link: () => Link,
	MD: () => MD,
	Markdown: () => Markdown,
	MarkdownOriginal: () => MarkdownOriginal,
	MemoryConversationStore: () => MemoryConversationStore,
	Mention: () => Mention,
	MessageDirect: () => MessageDirect,
	Middleware: () => Middleware,
	MiddlewareRouter: () => MiddlewareRouter,
	MiddlewareTree: () => MiddlewareTree,
	OnMiddleware: () => OnMiddleware,
	OnProcessor: () => OnProcessor,
	OnResponse: () => OnResponse,
	ProcessorEventAutoClearMap: () => ProcessorEventAutoClearMap,
	ProcessorEventUserAutoClearMap: () => ProcessorEventUserAutoClearMap,
	Response: () => Response,
	ResponseMiddleware: () => ResponseMiddleware,
	ResponseRouter: () => ResponseRouter,
	ResponseTree: () => ResponseTree,
	Router: () => Router,
	State: () => State,
	StateSubscribe: () => StateSubscribe,
	SubscribeList: () => SubscribeList,
	Text: () => Text,
	Video: () => Video,
	bumpStoreVersion: () => bumpStoreVersion,
	cbpClient: () => cbpClient,
	checkFallbackHint: () => checkFallbackHint,
	clearAllExpose: () => clearAllExpose,
	clearInterval: () => clearInterval,
	clearRuntimeAppKoaRouters: () => clearRuntimeAppKoaRouters,
	clearTimeout: () => clearTimeout,
	configureContext: () => configureContext,
	conversationIdentity: () => conversationIdentity,
	core: () => core,
	createContext: () => createContext,
	createConversationService: () => createConversationService,
	createDataFormat: () => createDataFormat,
	createEvent: () => createEvent,
	createRateLimiter: () => createRateLimiter,
	createSelects: () => createSelects,
	defineChildren: () => defineChildren,
	defineMiddleware: () => defineMiddleware,
	defineResponse: () => defineResponse,
	defineRouter: () => defineRouter,
	disposeAllRuntimeApps: () => disposeAllRuntimeApps,
	disposeExpose: () => disposeExpose,
	disposeRuntimeApp: () => disposeRuntimeApp,
	expendCycle: () => expendCycle,
	expendEvent: () => expendEvent,
	expendMiddleware: () => expendMiddleware,
	expendSubscribe: () => expendSubscribe,
	expendSubscribeCreate: () => expendSubscribeCreate,
	expendSubscribeMount: () => expendSubscribeMount,
	expendSubscribeUnmount: () => expendSubscribeUnmount,
	finishCurrentTrace: () => finishCurrentTrace,
	format: () => format,
	formatConversationPrompt: () => formatConversationPrompt,
	getChildrenApp: () => getChildrenApp,
	getCurrentAppName: () => getCurrentAppName,
	getCurrentEvent: () => getCurrentEvent,
	getCurrentNext: () => getCurrentNext,
	getCurrentPhase: () => getCurrentPhase,
	getMessageIntent: () => getMessageIntent,
	getRuntimeApp: () => getRuntimeApp,
	getRuntimeAppKoaRouters: () => getRuntimeAppKoaRouters,
	getSubscribeList: () => getSubscribeList,
	hasRuntimeAppCapability: () => hasRuntimeAppCapability,
	joinMarkdownParts: () => joinMarkdownParts,
	lazy: () => lazy,
	listChildrenApps: () => listChildrenApps,
	listRuntimeAppKoaRouters: () => listRuntimeAppKoaRouters,
	listRuntimeApps: () => listRuntimeApps,
	listSchedule: () => listSchedule,
	loadChildren: () => loadChildren,
	loadChildrenFile: () => loadChildrenFile,
	loadModels: () => loadModels,
	markEventSendAttempt: () => markEventSendAttempt,
	markEventSendFailure: () => markEventSendFailure,
	markEventSendSuccess: () => markEventSendSuccess,
	markdownToPlainText: () => markdownToPlainText,
	normalizeRoutePath: () => normalizeRoutePath,
	onCurrentEventFinished: () => onCurrentEventFinished,
	onGroup: () => onGroup,
	onMiddleware: () => onMiddleware,
	onProcessor: () => onProcessor,
	onResponse: () => onResponse,
	onSelects: () => onSelects,
	onState: () => onState,
	parseMessageText: () => parseMessageText,
	pauseSchedule: () => pauseSchedule,
	recordEventSendResults: () => recordEventSendResults,
	registerAppDir: () => registerAppDir,
	registerExpose: () => registerExpose,
	registerRuntimeApp: () => registerRuntimeApp,
	renderMarkdownBlockquote: () => renderMarkdownBlockquote,
	resumeSchedule: () => resumeSchedule,
	run: () => run,
	runHandler: () => runHandler,
	runWithTyping: () => runWithTyping,
	scheduleCancel: () => scheduleCancel,
	scheduleCancelAll: () => scheduleCancelAll,
	scheduleCancelByApp: () => scheduleCancelByApp,
	scheduleCron: () => scheduleCron,
	scheduleInterval: () => scheduleInterval,
	scheduleList: () => scheduleList,
	schedulePause: () => schedulePause,
	scheduleResume: () => scheduleResume,
	scheduleTimeout: () => scheduleTimeout,
	sendToChannel: () => sendToChannel,
	sendToUser: () => sendToUser,
	setCron: () => setCron,
	setInterval: () => setInterval,
	setRuntimeAppKoaRouters: () => setRuntimeAppKoaRouters,
	setTimeout: () => setTimeout,
	startTypingIndicator: () => startTypingIndicator,
	toRuntimeAppSnapshot: () => toRuntimeAppSnapshot,
	unChildren: () => unChildren,
	unState: () => unState,
	unregisterAppDir: () => unregisterAppDir,
	updateRuntimeAppCapabilities: () => updateRuntimeAppCapabilities,
	updateRuntimeAppStatus: () => updateRuntimeAppStatus,
	useAnnounce: () => useAnnounce,
	useAudio: () => useAudio,
	useChannel: () => useChannel,
	useChannelSettings: () => useChannelSettings,
	useClient: () => useClient,
	useConnection: () => useConnection,
	useConversation: () => useConversation,
	useEvent: () => useEvent,
	useForum: () => useForum,
	useGuild: () => useGuild,
	useHistory: () => useHistory,
	useInteraction: () => useInteraction,
	useMe: () => useMe,
	useMedia: () => useMedia,
	useMember: () => useMember,
	useMention: () => useMention,
	useMenu: () => useMenu,
	useMessage: () => useMessage,
	useObserver: () => useObserver,
	usePanel: () => usePanel,
	usePermission: () => usePermission,
	useReaction: () => useReaction,
	useRequest: () => useRequest,
	useRole: () => useRole,
	useRoute: () => useRoute,
	useSchedule: () => useSchedule,
	useSend: () => useSend,
	useSends: () => useSends,
	useState: () => useState,
	useSubscribe: () => useSubscribe,
	useUser: () => useUser,
	validateRouteArgs: () => validateRouteArgs,
	validateRouteArgsForCommand: () => validateRouteArgsForCommand,
	withEventContext: () => withEventContext,
	withProcessorTrace: () => withProcessorTrace
});

//#endregion
export { ActionsEventEnum, Attachment, Audio, BT, Button, ChildrenApp, Core, Expose, Format, FormatButtonGroup, FormatMarkDown, FormatSelect, Image, ImageFile, ImageURL, Link, MD, Markdown, MarkdownOriginal, MemoryConversationStore, Mention, MessageDirect, Middleware, MiddlewareRouter, MiddlewareTree, OnMiddleware, OnProcessor, OnResponse, ProcessorEventAutoClearMap, ProcessorEventUserAutoClearMap, Response, ResponseMiddleware, ResponseRouter, ResponseTree, Router, State, StateSubscribe, SubscribeList, Text, Video, application_exports, bumpStoreVersion, cbpClient, checkFallbackHint, clearAllExpose, clearInterval, clearRuntimeAppKoaRouters, clearTimeout, configureContext, conversationIdentity, core, createContext, createConversationService, createDataFormat, createEvent, createRateLimiter, createSelects, defineChildren, defineMiddleware, defineResponse, defineRouter, disposeAllRuntimeApps, disposeExpose, disposeRuntimeApp, expendCycle, expendEvent, expendMiddleware, expendSubscribe, expendSubscribeCreate, expendSubscribeMount, expendSubscribeUnmount, finishCurrentTrace, format, formatConversationPrompt, getChildrenApp, getCurrentAppName, getCurrentEvent, getCurrentNext, getCurrentPhase, getMessageIntent, getRuntimeApp, getRuntimeAppKoaRouters, getSubscribeList, hasRuntimeAppCapability, joinMarkdownParts, lazy, listChildrenApps, listRuntimeAppKoaRouters, listRuntimeApps, listSchedule, loadChildren, loadChildrenFile, loadModels, markEventSendAttempt, markEventSendFailure, markEventSendSuccess, markdownToPlainText, normalizeRoutePath, onCurrentEventFinished, onGroup, onMiddleware, onProcessor, onResponse, onSelects, onState, parseMessageText, pauseSchedule, recordEventSendResults, registerAppDir, registerExpose, registerRuntimeApp, renderMarkdownBlockquote, resumeSchedule, run, runHandler, runWithTyping, scheduleCancel, scheduleCancelAll, scheduleCancelByApp, scheduleCron, scheduleInterval, scheduleList, schedulePause, scheduleResume, scheduleTimeout, sendToChannel, sendToUser, setCron, setInterval, setRuntimeAppKoaRouters, setTimeout, startTypingIndicator, toRuntimeAppSnapshot, unChildren, unState, unregisterAppDir, updateRuntimeAppCapabilities, updateRuntimeAppStatus, useAnnounce, useAudio, useChannel, useChannelSettings, useClient, useConnection, useConversation, useEvent, useForum, useGuild, useHistory, useInteraction, useMe, useMedia, useMember, useMention, useMenu, useMessage, useObserver, usePanel, usePermission, useReaction, useRequest, useRole, useRoute, useSchedule, useSend, useSends, useState, useSubscribe, useUser, validateRouteArgs, validateRouteArgsForCommand, withEventContext, withProcessorTrace };