// API contracts checked against @alicloud/dingtalk 2.2.48, robot_1_0.
// Only protocol names, fields and routes are represented; no SDK implementation is included.

export type AddOrgRobotInstanceToGroupRequest = {
  openConversationId: string;
  robotCode: string;
};

export type AddOrgRobotInstanceToGroupResponseBody = {
  result?: boolean;
};

export type BatchOTOQueryRequest = {
  processQueryKey: string;
  robotCode: string;
};

export type BatchOTOQueryResponseBody = {
  messageReadInfoList?: BatchOTOQueryResponseBodyMessageReadInfoList[];
  sendStatus?: string;
};

export type BatchOTOQueryResponseBodyMessageReadInfoList = {
  name?: string;
  readStatus?: string;
  readTimestamp?: number;
  userId?: string;
};

export type BatchRecallGroupRequest = {
  chatbotId: string;
  openConversationId: string;
  processQueryKeys: string[];
};

export type BatchRecallGroupResponseBody = {
  failedResult?: { [key: string]: string };
  successResult?: string[];
};

export type BatchRecallOTORequest = {
  processQueryKeys: string[];
  robotCode: string;
};

export type BatchRecallOTOResponseBody = {
  failedResult?: { [key: string]: string };
  successResult?: string[];
};

export type BatchRecallPrivateChatRequest = {
  openConversationId: string;
  processQueryKeys: string[];
  robotCode: string;
};

export type BatchRecallPrivateChatResponseBody = {
  failedResult?: { [key: string]: string };
  successResult?: string[];
};

export type BatchSendOTORequest = {
  msgKey: string;
  msgParam: string;
  robotCode: string;
  userIds: string[];
};

export type BatchSendOTOResponseBody = {
  filteredStaffIdList?: string[];
  flowControlledStaffIdList?: string[];
  invalidStaffIdList?: string[];
  processQueryKey?: string;
};

export type ClearRobotPluginRequest = {
  robotCode: string;
};

export type ClearRobotPluginResponseBody = {
  result?: boolean;
};

export type DeleteCustomRobotRequest = {
  actionType: string;
  sendNotification: boolean;
  token: string;
};

export type DeleteCustomRobotResponseBody = {
  result?: boolean;
};

export type ExecuteRobotAiSkillRequest = {
  context?: { [key: string]: unknown };
  input: string;
  robotCode: string;
  skillId?: string;
};

export type ExecuteRobotAiSkillResponseBody = {
  result?: string;
  skillExecuteId?: string;
};

export type GetBotListInGroupRequest = {
  openConversationId: string;
};

export type GetBotListInGroupResponseBody = {
  chatbotInstanceVOList?: GetBotListInGroupResponseBodyChatbotInstanceVOList[];
};

export type GetBotListInGroupResponseBodyChatbotInstanceVOList = {
  downloadIconURL?: string;
  name?: string;
  openRobotType?: number;
  robotCode?: string;
};

export type ManageSingleChatRobotStatusRequest = {
  robotCode: string;
  status: string;
};

export type ManageSingleChatRobotStatusResponseBody = {
  result?: boolean;
};

export type OrgGroupQueryRequest = {
  maxResults?: number;
  nextToken?: string;
  openConversationId?: string;
  processQueryKey: string;
  robotCode?: string;
  token?: string;
};

export type OrgGroupQueryResponseBody = {
  hasMore?: boolean;
  nextToken?: string;
  readUserIds?: string[];
  readUsers?: OrgGroupQueryResponseBodyReadUsers[];
  sendStatus?: string;
};

export type OrgGroupQueryResponseBodyReadUsers = {
  unionId?: string;
  userId?: string;
};

export type OrgGroupRecallRequest = {
  openConversationId: string;
  processQueryKeys: string[];
  robotCode: string;
};

export type OrgGroupRecallResponseBody = {
  failedResult?: { [key: string]: string };
  successResult?: string[];
};

export type OrgGroupSendRequest = {
  coolAppCode?: string;
  msgKey: string;
  msgParam: string;
  openConversationId?: string;
  robotCode?: string;
  token?: string;
};

export type OrgGroupSendResponseBody = {
  processQueryKey?: string;
};

export type PrivateChatQueryRequest = {
  maxResults?: number;
  nextToken?: string;
  openConversationId?: string;
  processQueryKey: string;
  robotCode?: string;
};

export type PrivateChatQueryResponseBody = {
  hasMore?: boolean;
  nextToken?: string;
  readUserIds?: string[];
  sendStatus?: string;
};

export type PrivateChatSendRequest = {
  coolAppCode?: string;
  msgKey: string;
  msgParam: string;
  openConversationId?: string;
  robotCode?: string;
};

export type PrivateChatSendResponseBody = {
  processQueryKey?: string;
};

export type QueryBotInstanceInGroupInfoRequest = {
  pageNumber: number;
  pageSize: number;
  robotCode: string;
};

export type QueryBotInstanceInGroupInfoResponseBody = {
  hasMore?: boolean;
  openConversationIds?: string[];
};

export type QueryRobotDingReadStatusRequest = {
  openDingId: string;
  robotCode: string;
};

export type QueryRobotDingReadStatusResponseBody = {
  result?: QueryRobotDingReadStatusResponseBodyResult;
  success?: boolean;
};

export type QueryRobotDingReadStatusResponseBodyResult = {
  robotDingReadInfoList?: QueryRobotDingReadStatusResponseBodyResultRobotDingReadInfoList[];
};

export type QueryRobotDingReadStatusResponseBodyResultRobotDingReadInfoList = {
  readStatus?: string;
  userId?: string;
};

export type QueryRobotInstanceInGroupInfoRequest = {
  maxResult: number;
  nextToken?: string;
  robotCode: string;
};

export type QueryRobotInstanceInGroupInfoResponseBody = {
  hasMore?: boolean;
  nextToken?: string;
  openConversationIds?: string[];
};

export type QueryRobotPluginRequest = {
  robotCode: string;
};

export type QueryRobotPluginResponseBody = {
  pluginInfoList?: QueryRobotPluginResponseBodyPluginInfoList[];
};

export type QueryRobotPluginResponseBodyPluginInfoList = {
  icon?: string;
  mobileUrl?: string;
  name?: string;
  pcUrl?: string;
};

export type RobotMessageFileDownloadRequest = {
  downloadCode: string;
  robotCode: string;
};

export type RobotMessageFileDownloadResponseBody = {
  downloadUrl?: string;
};

export type RobotRecallDingRequest = {
  openDingId: string;
  robotCode: string;
};

export type RobotRecallDingResponseBody = {
  openDingId?: string;
};

export type RobotRecallEmotionRequest = {
  emotionName?: string;
  emotionType?: number;
  openConversationId: string;
  openMsgId: string;
  robotCode: string;
  textEmotion?: RobotRecallEmotionRequestTextEmotion;
};

export type RobotRecallEmotionRequestTextEmotion = {
  backgroundId?: string;
  emotionId?: string;
  emotionName?: string;
  text?: string;
};

export type RobotRecallEmotionResponseBody = {
  success?: boolean;
};

export type RobotReplyEmotionRequest = {
  emotionName?: string;
  emotionType?: number;
  openConversationId: string;
  openMsgId: string;
  robotCode: string;
  textEmotion?: RobotReplyEmotionRequestTextEmotion;
};

export type RobotReplyEmotionRequestTextEmotion = {
  backgroundId?: string;
  emotionId?: string;
  emotionName?: string;
  text?: string;
};

export type RobotReplyEmotionResponseBody = {
  success?: boolean;
};

export type RobotSendDingRequest = {
  callVoice?: string;
  content: string;
  receiverUserIdList: string[];
  remindType: number;
  robotCode: string;
};

export type RobotSendDingResponseBody = {
  failedList?: { [key: string]: unknown };
  openDingId?: string;
};

export type SendRobotDingMessageRequest = {
  contentParams: { [key: string]: string };
  dingTemplateId: string;
  openConversationId: string;
  receiverUserIdList: string[];
  robotCode: string;
};

export type SendRobotDingMessageResponseBody = {
  dingSendResultId?: string;
};

export type SetRobotPluginRequest = {
  pluginInfoList?: SetRobotPluginRequestPluginInfoList[];
  robotCode?: string;
};

export type SetRobotPluginRequestPluginInfoList = {
  icon?: string;
  mobileUrl?: string;
  name?: string;
  pcUrl?: string;
};

export type SetRobotPluginResponseBody = {
  result?: boolean;
};

export type UpdateCustomRobotOutgoingRequest = {
  outgoingUrl: string;
  token: string;
  userCustomToken?: string;
};

export type UpdateCustomRobotOutgoingResponseBody = {
  originalUrl?: string;
  result?: boolean;
  targetUrl?: string;
};

export type UpdateInstalledRobotRequest = {
  brief?: string;
  description?: string;
  icon?: string;
  name?: string;
  robotCode: string;
  updateType: number;
};

export type UpdateInstalledRobotResponseBody = {
  success?: boolean;
};

export type RobotApiMap = {
  addOrgRobotInstanceToGroup: [AddOrgRobotInstanceToGroupRequest, AddOrgRobotInstanceToGroupResponseBody];
  batchOTOQuery: [BatchOTOQueryRequest, BatchOTOQueryResponseBody];
  batchRecallGroup: [BatchRecallGroupRequest, BatchRecallGroupResponseBody];
  batchRecallOTO: [BatchRecallOTORequest, BatchRecallOTOResponseBody];
  batchRecallPrivateChat: [BatchRecallPrivateChatRequest, BatchRecallPrivateChatResponseBody];
  batchSendOTO: [BatchSendOTORequest, BatchSendOTOResponseBody];
  clearRobotPlugin: [ClearRobotPluginRequest, ClearRobotPluginResponseBody];
  deleteCustomRobot: [DeleteCustomRobotRequest, DeleteCustomRobotResponseBody];
  executeRobotAiSkill: [ExecuteRobotAiSkillRequest, ExecuteRobotAiSkillResponseBody];
  getBotListInGroup: [GetBotListInGroupRequest, GetBotListInGroupResponseBody];
  manageSingleChatRobotStatus: [ManageSingleChatRobotStatusRequest, ManageSingleChatRobotStatusResponseBody];
  orgGroupQuery: [OrgGroupQueryRequest, OrgGroupQueryResponseBody];
  orgGroupRecall: [OrgGroupRecallRequest, OrgGroupRecallResponseBody];
  orgGroupSend: [OrgGroupSendRequest, OrgGroupSendResponseBody];
  privateChatQuery: [PrivateChatQueryRequest, PrivateChatQueryResponseBody];
  privateChatSend: [PrivateChatSendRequest, PrivateChatSendResponseBody];
  queryBotInstanceInGroupInfo: [QueryBotInstanceInGroupInfoRequest, QueryBotInstanceInGroupInfoResponseBody];
  queryRobotDingReadStatus: [QueryRobotDingReadStatusRequest, QueryRobotDingReadStatusResponseBody];
  queryRobotInstanceInGroupInfo: [QueryRobotInstanceInGroupInfoRequest, QueryRobotInstanceInGroupInfoResponseBody];
  queryRobotPlugin: [QueryRobotPluginRequest, QueryRobotPluginResponseBody];
  robotMessageFileDownload: [RobotMessageFileDownloadRequest, RobotMessageFileDownloadResponseBody];
  robotRecallDing: [RobotRecallDingRequest, RobotRecallDingResponseBody];
  robotRecallEmotion: [RobotRecallEmotionRequest, RobotRecallEmotionResponseBody];
  robotReplyEmotion: [RobotReplyEmotionRequest, RobotReplyEmotionResponseBody];
  robotSendDing: [RobotSendDingRequest, RobotSendDingResponseBody];
  sendRobotDingMessage: [SendRobotDingMessageRequest, SendRobotDingMessageResponseBody];
  setRobotPlugin: [SetRobotPluginRequest, SetRobotPluginResponseBody];
  updateCustomRobotOutgoing: [UpdateCustomRobotOutgoingRequest, UpdateCustomRobotOutgoingResponseBody];
  updateInstalledRobot: [UpdateInstalledRobotRequest, UpdateInstalledRobotResponseBody];
};

export const robotRoutes = {
  addOrgRobotInstanceToGroup: ['POST', 'robot/groups/orgRobots/add'],
  batchOTOQuery: ['GET', 'robot/oToMessages/readStatus'],
  batchRecallGroup: ['POST', 'robot/groupMessages/batchRecall'],
  batchRecallOTO: ['POST', 'robot/otoMessages/batchRecall'],
  batchRecallPrivateChat: ['POST', 'robot/privateChatMessages/batchRecall'],
  batchSendOTO: ['POST', 'robot/oToMessages/batchSend'],
  clearRobotPlugin: ['POST', 'robot/plugins/clear'],
  deleteCustomRobot: ['POST', 'robot/custom/delete'],
  executeRobotAiSkill: ['POST', 'robot/aiSkill/execute'],
  getBotListInGroup: ['POST', 'robot/groups/robots/query'],
  manageSingleChatRobotStatus: ['POST', 'robot/statuses/manage'],
  orgGroupQuery: ['POST', 'robot/groupMessages/query'],
  orgGroupRecall: ['POST', 'robot/groupMessages/recall'],
  orgGroupSend: ['POST', 'robot/groupMessages/send'],
  privateChatQuery: ['POST', 'robot/privateChatMessages/query'],
  privateChatSend: ['POST', 'robot/privateChatMessages/send'],
  queryBotInstanceInGroupInfo: ['POST', 'robot/groups/query'],
  queryRobotDingReadStatus: ['POST', 'robot/ding/readStatuses/query'],
  queryRobotInstanceInGroupInfo: ['POST', 'robot/installed/groups/query'],
  queryRobotPlugin: ['POST', 'robot/plugins/query'],
  robotMessageFileDownload: ['POST', 'robot/messageFiles/download'],
  robotRecallDing: ['POST', 'robot/ding/recall'],
  robotRecallEmotion: ['POST', 'robot/emotion/recall'],
  robotReplyEmotion: ['POST', 'robot/emotion/reply'],
  robotSendDing: ['POST', 'robot/ding/send'],
  sendRobotDingMessage: ['POST', 'robot/dingMessages/send'],
  setRobotPlugin: ['POST', 'robot/plugins/set'],
  updateCustomRobotOutgoing: ['POST', 'robot/custom/outgoing/update'],
  updateInstalledRobot: ['PUT', 'robot/managements/infos']
} as const;

export type RobotApi = { [K in keyof RobotApiMap]: (params: RobotApiMap[K][0]) => Promise<RobotApiMap[K][1]> };

export function createRobotApi(request: (path: string, body?: unknown, method?: string) => Promise<unknown>): RobotApi {
  return Object.fromEntries(
    Object.entries(robotRoutes).map(([name, [method, path]]) => [
      name,
      (params: Record<string, unknown>) => {
        if (method === 'GET') {
          const query = new URLSearchParams();

          for (const [key, value] of Object.entries(params)) {
            if (value !== undefined) {
              query.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
            }
          }

          return request(`${path}?${query}`, undefined, method);
        }

        return request(path, params, method);
      }
    ])
  ) as unknown as RobotApi;
}
