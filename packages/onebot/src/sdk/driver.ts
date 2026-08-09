import type { OneBotV12Event } from './typing';

export type OneBotProtocol = 11 | 12;

/** Internal protocol boundary. Transports are shared; decoding is protocol-specific. */
export interface OneBotDriver {
  readonly version: OneBotProtocol;
  isProtocolMessage(message: any): boolean;
  isReadyMessage(message: any): boolean;
  dispatch(message: any, emit: (name: string, event: any) => void): void;
}

export class V11Driver implements OneBotDriver {
  readonly version = 11 as const;

  isProtocolMessage(message: any) {
    return Boolean(message?.post_type);
  }

  isReadyMessage(message: any) {
    return message?.post_type === 'meta_event';
  }

  dispatch(event: any, emit: (name: string, event: any) => void) {
    if (event?.post_type === 'meta_event') emit('META', event);
    else if (event?.post_type === 'message') emit(event.message_type === 'group' ? 'MESSAGES' : 'DIRECT_MESSAGE', event);
    else if (event?.post_type === 'request') emit(event.request_type === 'friend' ? 'REQUEST_ADD_FRIEND' : 'REQUEST_ADD_GROUP', event);
    else if (event?.post_type === 'notice') {
      const notices: Record<string, string> = {
        group_increase: 'NOTICE_GROUP_MEMBER_INCREASE',
        group_decrease: 'NOTICE_GROUP_MEMBER_REDUCE',
        group_recall: 'NOTICE_GROUP_RECALL',
        friend_recall: 'NOTICE_FRIEND_RECALL',
        group_ban: 'NOTICE_GROUP_BAN',
        group_upload: 'NOTICE_GROUP_UPLOAD',
        offline_file: 'NOTICE_OFFLINE_FILE',
        group_admin: 'NOTICE_GROUP_ADMIN',
        notify: 'NOTICE_NOTIFY',
        friend_add: 'NOTICE_FRIEND_ADD'
      };
      const name = notices[event.notice_type];
      if (name) emit(name, event);
    }
  }
}

export class V12Driver implements OneBotDriver {
  readonly version = 12 as const;

  isProtocolMessage(message: any) {
    return Boolean(message?.type && message?.self && !message?.post_type);
  }

  isReadyMessage(message: any) {
    return (
      message?.type === 'meta' &&
      message?.detail_type === 'connect' &&
      String(message.version?.onebot_version ?? message.onebot_version ?? message.version?.protocol_version ?? '') === '12'
    );
  }

  dispatch(event: OneBotV12Event, emit: (name: string, event: any) => void) {
    emit('V12_EVENT', event);
  }
}
