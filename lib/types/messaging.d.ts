import { User } from "./event/base/user.js";
import { MessageMediaItem } from "./event/base/message.js";
import { PaginatedResult, PaginationParams } from "./standard.js";
import { ActionTarget } from "./actions.js";
//#region src/types/messaging.d.ts
/** Hooks accept either an event or an explicit context for scheduled/proactive work. */
type ActionContext = {
  Platform?: string;
  BotId?: string;
  GuildId?: string;
  ChannelId?: string;
  UserId?: string;
  MessageId?: string;
  InteractionId?: string;
  SpaceId?: string;
  IsPrivate?: boolean;
  Target?: ActionTarget;
};
type MenuItem = {
  name: string;
} & ({
  type: 'message';
  text: string;
} | {
  type: 'link';
  url: string;
} | {
  type: 'switch';
  id: string;
  default?: boolean;
} | {
  type: 'menu';
  items: ({
    name: string;
  } & ({
    type: 'message';
    text: string;
  } | {
    type: 'link';
    url: string;
  }))[];
});
type Menu = {
  items: MenuItem[];
};
/** Conversation scopes covered by the non-channel QQ Bot framework surface. */
type NonChannelConversationScope = 'group' | 'c2c';
type CommandPanel = {
  items: {
    name: string;
    description?: string;
    type: 'command' | 'link';
    adminOnly?: boolean;
    url?: string;
  }[];
  remark?: string;
  version?: number;
};
type PanelCreateParams = {
  scope: NonChannelConversationScope;
  audience?: 'all' | 'specific';
  userIds?: string[];
  guildIds?: string[];
  panel: CommandPanel;
};
type PanelInfo = PanelCreateParams & {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
};
type JoinRequestInfo = {
  id: string;
  guildId: string;
  userId: string;
  userName?: string;
  unionId?: string;
  isBot?: boolean;
  risk?: string;
  appliedAt?: string;
  source?: string;
  inviterId?: string;
  verification?: {
    method: string;
    message?: string;
    questions?: {
      question: string;
      answer: string;
    }[];
  };
  approvedByStrategyId?: string;
};
type JoinRequestDecision = {
  guildId?: string;
  userId: string;
  requestId?: string;
  approve: boolean;
  reason?: string;
  blacklist?: boolean;
};
type JoinPolicyParams = {
  guildIds?: string[];
  guildNumbers?: string[];
  enabled?: boolean;
  expiresAt?: string;
  remark?: string;
};
type JoinPolicyCreate = Omit<JoinPolicyParams, 'guildIds' | 'guildNumbers'> & ({
  guildIds: string[];
  guildNumbers?: never;
} | {
  guildNumbers: string[];
  guildIds?: never;
});
type JoinPolicyUpdate = Omit<JoinPolicyParams, 'guildIds' | 'guildNumbers'> & {
  guilds?: {
    operation: 'add' | 'remove';
    ids?: string[];
    numbers?: string[];
  };
};
type JoinPolicyInfo = JoinPolicyParams & {
  id: string;
  whitelistCount?: number;
  createdAt?: string;
  updatedAt?: string;
};
type MemberMuteChange = {
  userId: string;
  operation: 'add' | 'update' | 'remove';
  expiresAt?: string;
};
type GuildMuteState = {
  global?: {
    mode: 'none' | 'always' | 'schedule';
    schedules?: {
      id: string;
      start: string;
      end: string;
      enabled: boolean;
    }[];
    recurring?: {
      id: string;
      weekdays: number[];
      start: string;
      end: string;
      enabled: boolean;
    }[];
  };
  members: {
    userId: string;
    userName?: string;
    unionId?: string;
    expiresAt: string;
  }[];
};
type GuildBotState = {
  userId: string;
  joinedAt?: string;
  role?: string;
  allowsProactiveMessages?: boolean;
  receiveMode?: string;
};
type BlacklistMember = {
  userId: string;
  userName?: string;
  unionId?: string;
  isBot?: boolean;
  bannedAt?: string;
};
type MessageButton = {
  id: string;
  label: string;
  visitedLabel?: string;
  style?: number;
  groupId?: string;
  action: {
    type: 'link' | 'callback' | 'command';
    data: string;
    permission?: {
      type: 'users' | 'admins' | 'everyone' | 'roles';
      userIds?: string[];
      roleIds?: string[];
    };
    autoSend?: boolean;
    reply?: boolean;
    hint?: string;
    anchor?: number;
    clickLimit?: number;
    modal?: {
      content?: string;
      confirmText?: string;
      cancelText?: string;
    };
  };
};
/** Complete structured message representation, independent of any SDK. */
type OutgoingMessage = {
  text?: string;
  markdown?: {
    content?: string;
    templateId?: string;
    legacyTemplateId?: number;
    params?: {
      key: string;
      values: string[];
    }[];
    verifyImages?: boolean;
  };
  keyboard?: {
    templateId?: string;
    rows?: MessageButton[][];
  };
  media?: {
    fileId: string;
  };
  card?: {
    templateId: number;
    fields: {
      key: string;
      value?: string;
      objects?: {
        fields: {
          key: string;
          value: string;
        }[];
      }[];
    }[];
  };
};
type MessageDelivery = {
  target?: ActionTarget;
  replyId?: string;
  eventId?: string;
  referenceId?: string;
  sequence?: number;
  wakeup?: boolean;
};
type MessageReceipt = {
  id: string;
  timestamp?: string;
  referenceId?: string;
};
type StreamMessageParams = MessageDelivery & {
  text: string;
  mode?: 'append' | 'replace';
  state?: 'generating' | 'complete';
  contentType?: 'text' | 'markdown';
  index?: number;
  streamId?: string;
};
type StreamReceipt = MessageReceipt & {
  remainingLength?: number;
};
type MediaUploadPrepare = {
  target?: ActionTarget;
  type: 'image' | 'video' | 'audio' | 'file';
  name: string;
  size: string;
  hashes: {
    md5: string;
    sha1: string;
    headMd5: string;
  };
};
type MediaUploadSession = {
  id: string;
  blockSize: string;
  parts: {
    index: number;
    url: string;
    size: string;
  }[];
  config: {
    concurrency: number;
    retryTimeout: number;
    retryDelay: number;
  };
};
type MediaUploadComplete = {
  target?: ActionTarget;
  uploadId: string;
  type: MediaUploadPrepare['type'];
  name?: string;
  send?: boolean;
};
type MediaReceipt = {
  fileId: string;
  uuid?: string;
  ttl?: number;
  messageId?: string;
  url?: string;
  expiresAt?: number;
  reused?: boolean;
};
type MessageSubscription = {
  templateId?: number;
  customTemplateId?: string;
  allowed: boolean;
  subscriptionId: string;
  subscribedAt?: number;
  updatedAt?: number;
};
type InteractionDetails = {
  type: 'button' | 'menu' | 'feedback' | 'clear-session' | 'story' | 'model' | 'authorization' | 'authorization-status' | 'unknown';
  buttonId?: string;
  data?: string;
  featureId?: string;
  messageId?: string;
  feedback?: 'like' | 'dislike';
  checked?: boolean;
  action?: string;
  authorization?: {
    scene?: string;
    scope?: string;
  };
  context?: Record<string, string>;
  requiresAck: boolean;
  acknowledged: boolean;
};
type ReceivedMessage = {
  type?: number;
  referenceId?: string;
  replyReferenceId?: string;
  source?: string;
  context?: Record<string, string>;
  card?: {
    type?: string;
    name?: string;
    prompt?: string;
    fields?: Record<string, unknown>;
  };
  elements?: {
    referenceId?: string;
    userId?: string;
    userName?: string;
    author?: User;
    text?: string;
    content: ReceivedMessage;
    attachments?: MessageMediaItem[];
  }[];
};
type StandardEventDetails = {
  /** Protocol text before optional adapter sanitization. */
  RawMessageText?: string;
  Target?: ActionTarget;
  Notice?: {
    type: 'join-request';
    request: JoinRequestInfo;
  } | {
    type: 'subscription';
    subscriptions: MessageSubscription[];
  } | {
    type: 'message-permission';
    enabled: boolean;
  };
  Interaction?: InteractionDetails;
  MessageContent?: ReceivedMessage;
  MessageMentions?: User[];
  FriendSource?: {
    scene?: number;
    data?: string;
    code?: string;
    unionId?: string;
  };
  EventId?: string;
  OccurredAt?: number;
};
/** Semantic actions used by hooks; adapters translate wire formats. */
type MessagingActionMap = {
  'menu.get': [Record<string, never>, {
    menu?: Menu;
    version: number;
  }];
  'menu.set': [{
    menu: Menu;
  }, {
    version: number;
  }];
  'panel.list': [{
    scope: NonChannelConversationScope;
    pagination?: PaginationParams;
  }, PaginatedResult<PanelInfo>];
  'panel.create': [PanelCreateParams, {
    id: string;
  }];
  'panel.get': [{
    id: string;
  }, PanelInfo];
  'panel.update': [{
    id: string;
    panel: CommandPanel;
  }, {
    version: number;
  }];
  'panel.delete': [{
    id: string;
  }, unknown];
  'panel.targets.update': [{
    id: string;
    operation: 'add' | 'remove';
    userIds?: string[];
    guildIds?: string[];
  }, unknown];
  'me.share': [{
    data?: string;
  }, {
    url: string;
  }];
  'connection.gateway': [Record<string, never>, {
    url: string;
  }];
  'guild.bot.info': [{
    guildId?: string;
  }, GuildBotState];
  'guild.mute.get': [{
    guildId?: string;
  }, GuildMuteState];
  'member.kick.batch': [{
    guildId?: string;
    userIds: string[];
    blacklist?: boolean;
  }, {
    status: string;
    failedBlacklistIds: string[];
  }];
  'member.blacklist.list': [{
    guildId?: string;
    pagination?: PaginationParams;
  }, PaginatedResult<BlacklistMember>];
  'member.blacklist.update': [{
    guildId?: string;
    operation: 'add' | 'remove';
    userIds: string[];
  }, {
    failedUserIds: string[];
  }];
  'member.mute.batch': [{
    guildId?: string;
    members: MemberMuteChange[];
  }, unknown];
  'request.guild.list': [{
    guildId?: string;
    pagination?: PaginationParams;
  }, PaginatedResult<JoinRequestInfo>];
  'request.guild.decide': [JoinRequestDecision, unknown];
  'request.policy.list': [{
    pagination?: PaginationParams;
  }, PaginatedResult<JoinPolicyInfo>];
  'request.policy.create': [JoinPolicyCreate, Pick<JoinPolicyInfo, 'id' | 'enabled' | 'expiresAt'>];
  'request.policy.update': [{
    id: string;
  } & JoinPolicyUpdate, Pick<JoinPolicyInfo, 'enabled' | 'expiresAt'>];
  'request.policy.delete': [{
    id: string;
  }, unknown];
  'request.policy.execute': [{
    id: string;
  }, unknown];
  'request.policy.whitelist': [{
    id: string;
    operation: 'add' | 'remove';
    userIds: string[];
  }, Pick<JoinPolicyInfo, 'id' | 'whitelistCount' | 'updatedAt'>];
  'message.typing': [MessageDelivery & {
    duration?: number;
  }, MessageReceipt];
  'message.stream': [StreamMessageParams, StreamReceipt];
  'media.prepare': [MediaUploadPrepare, MediaUploadSession];
  'media.part.finish': [{
    target?: ActionTarget;
    uploadId: string;
    index: number;
    size: string;
    md5: string;
  }, unknown];
  'media.complete': [MediaUploadComplete, MediaReceipt];
};
type MessagingActions = { [K in keyof MessagingActionMap]: {
  action: K;
  payload: {
    event?: ActionContext;
    BotId?: string;
    target?: ActionTarget;
    params: MessagingActionMap[K][0];
  };
}; }[keyof MessagingActionMap];
//#endregion
export { ActionContext, BlacklistMember, CommandPanel, GuildBotState, GuildMuteState, InteractionDetails, JoinPolicyCreate, JoinPolicyInfo, JoinPolicyParams, JoinPolicyUpdate, JoinRequestDecision, JoinRequestInfo, MediaReceipt, MediaUploadComplete, MediaUploadPrepare, MediaUploadSession, MemberMuteChange, Menu, MenuItem, MessageButton, MessageDelivery, MessageReceipt, MessageSubscription, MessagingActionMap, MessagingActions, NonChannelConversationScope, OutgoingMessage, PanelCreateParams, PanelInfo, ReceivedMessage, StandardEventDetails, StreamMessageParams, StreamReceipt };