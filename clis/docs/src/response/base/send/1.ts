import { sendToChannel, sendToUser, Text } from 'alemonjs';

const data = format(Text('hello word'));

// 向指定频道发送消息
sendToChannel('SpaceId', data);
// 向指定用户发送消息
sendToUser('OpenID', data);
