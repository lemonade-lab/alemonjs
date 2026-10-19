import { ResultCode } from "../../common/variable.js";
import { Result, createResult } from "../../common/result.js";
import { User } from "../../types/event/base/user.js";
import { DataEnums } from "../../types/message/index.js";
import { ChannelInfo, GuildInfo, MemberInfo, PaginatedResult, PaginationParams, RoleInfo } from "../../types/standard.js";
import { EventKeys, Events } from "../../types/event/map.js";
import "../../types/index.js";
import { Format } from "../format/message-format.js";
import { getCurrentEvent, getCurrentNext, markEventSendAttempt, markEventSendFailure, recordEventSendResults } from "../runtime/hook-event-context.js";
import { sendAction } from "../runtime/cbp/processor/actions.js";
import { sendAPI } from "../runtime/cbp/processor/api.js";
import { ChildrenApp } from "../runtime/store.js";
//#region src/application/hooks/common.d.ts
type Options = {
  UserId?: string;
  UserKey?: string;
  UserName?: string;
  IsMaster?: boolean;
  IsBot?: boolean;
};
declare const getEventOrThrow: <T extends EventKeys>(event?: Events[T]) => Events[T];
//#endregion
export { type ChannelInfo, ChildrenApp, type DataEnums, type EventKeys, type Events, Format, type GuildInfo, type MemberInfo, Options, type PaginatedResult, type PaginationParams, type Result, ResultCode, type RoleInfo, type User, createResult, getCurrentEvent, getCurrentNext, getEventOrThrow, markEventSendAttempt, markEventSendFailure, recordEventSendResults, sendAPI, sendAction };