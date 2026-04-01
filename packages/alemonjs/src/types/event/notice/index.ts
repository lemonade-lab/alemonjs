import { Guild, Channel } from '../base/guild';
import { Message } from '../base/message';
import { User } from '../base/user';
import { Platform } from '../base/platform';
import { Expansion } from '../base/expansion';
// 公共通知（戳一戳、运气王、荣誉等平台级通知）
export type PublicEventNoticeCreate = Platform &
  Guild &
  Channel &
  Message &
  User & {
    name: 'notice.create';
  } & Expansion;
// 私有通知
export type PrivateEventNoticeCreate = Platform &
  Message &
  User & {
    name: 'private.notice.create';
  } & Expansion;
