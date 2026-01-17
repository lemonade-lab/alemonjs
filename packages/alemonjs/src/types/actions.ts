import { DataEnums } from './message';

export type ActionMessageSend = {
  // 发送消息
  action: 'message.send';
  // 负载
  payload: {
    // 事件
    event: any;
    // 参数
    params: {
      format?: DataEnums[];
    };
  };
};

// 主动消息
export type ActionMessageSendChannel = {
  // 主动发送消息
  action: 'message.send.channel';
  // 负载
  payload: {
    // 频道ID
    ChannelId: string;
    // 参数
    params: {
      format?: DataEnums[];
    };
  };
};

export type ActionMessageSendUser = {
  // 主动发送消息
  action: 'message.send.user';
  // 负载
  payload: {
    // 用户ID
    UserId: string;
    // 参数
    params: {
      format?: DataEnums[];
    };
  };
};

export type ActionMentionGet = {
  // 获取提及
  action: 'mention.get';
  // 负载
  payload: {
    event: any;
  };
};

export type ActionMessageDelete = {
  // 删除消息
  action: 'message.delete';
  // 负载
  payload: {
    // 消息ID
    MessageId: string;
  };
};

export type ActionFileSendChannel = {
  // 发送文件
  action: 'file.send.channel';
  // 负载
  payload: {
    // 频道ID
    ChannelId: string;
    // 参数
    params: {
      file: string;
      name?: string;
      folder?: string;
    };
  };
};

export type ActionFileSendUser = {
  // 发送文件
  action: 'file.send.user';
  // 负载
  payload: {
    // 用户ID
    UserId: string;
    // 参数
    params: {
      file: string;
      name?: string;
    };
  };
};

export type ActionMessageForwardUser = {
  // 发送合并转发消息
  action: 'message.forward.user';
  // 负载
  payload: {
    // 用户ID
    UserId: string;
    // 参数
    params: {
      // 时间
      time?: number;
      // 消息
      content: DataEnums[];
      // 用户ID
      user_id?: string;
      // 昵称
      nickname?: string;
    }[];
  };
};

export type ActionMessageForwardChannel = {
  // 发送合并转发消息
  action: 'message.forward.channel';
  // 负载
  payload: {
    // 频道ID
    ChannelId: string;
    // 参数
    params: {
      // 时间
      time?: number;
      // 消息
      content: DataEnums[];
      // 用户ID
      user_id?: string;
      // 昵称
      nickname?: string;
    }[];
  };
};

// 获取我的信息
export type ActionMeInfo = {
  action: 'me.info';
  payload: object;
};

type base = {
  // 动作ID
  actionId?: string;
  // 来源设备编号
  DeviceId?: string;
};

export type Actions = (
  | ActionMessageSend
  | ActionMentionGet
  | ActionMessageSendChannel
  | ActionMessageSendUser
  | ActionMessageDelete
  | ActionFileSendChannel
  | ActionFileSendUser
  | ActionMessageForwardUser
  | ActionMessageForwardChannel
  | ActionMeInfo
) &
  base;
