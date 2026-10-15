// Compile-only checks: SDK injection must not erase the public native API type.
import type { API as DingTalk } from '../../packages/dingtalk/src/index.js';
import type { API as Feishu } from '../../packages/feishu/src/index.js';
import type { API as GoogleChat } from '../../packages/google-chat/src/index.js';
import type { API as ICQQ } from '../../packages/icqq/src/index.js';
import type { API as LINE } from '../../packages/line/src/index.js';
import type { API as Matrix } from '../../packages/matrix/src/index.js';
import type { API as Mattermost } from '../../packages/mattermost/src/index.js';
import type { API as Slack } from '../../packages/slack/src/index.js';
import type { API as Teams } from '../../packages/teams/src/index.js';
import type { API as Twitch } from '../../packages/twitch/src/index.js';

type IsAny<T> = 0 extends 1 & T ? true : false;
type Typed<T extends false> = T;
export type PublicAPIsAreTyped = [
  Typed<IsAny<DingTalk>>, Typed<IsAny<Feishu>>, Typed<IsAny<GoogleChat>>,
  Typed<IsAny<ICQQ>>, Typed<IsAny<LINE>>, Typed<IsAny<Matrix>>,
  Typed<IsAny<Mattermost>>, Typed<IsAny<Slack>>, Typed<IsAny<Teams>>, Typed<IsAny<Twitch>>
];

declare const ding: DingTalk;
ding.robot.orgGroupRecall({ robotCode: 'bot', openConversationId: 'group', processQueryKeys: ['receipt'] });
// @ts-expect-error A received message ID is not the recall API contract.
ding.robot.orgGroupRecall({ robotCode: 'bot', MessageId: 'message' });
declare const slack: Slack;
slack.chat.postMessage({ channel: 'channel', text: 'hello' });
// @ts-expect-error The SDK requires a conversation ID.
slack.chat.postMessage({ text: 'hello' });
declare const feishu: Feishu;
feishu.im.messageReaction.delete({ path: { message_id: 'message', reaction_id: 'reaction' } });
// @ts-expect-error Removing a reaction requires its native reaction_id.
feishu.im.messageReaction.delete({ path: { message_id: 'message' } });
