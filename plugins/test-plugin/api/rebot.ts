/* 截图 */
import { createPicture } from '../../../src/lib/screenshot'
/* 转二维码 */
import { createQrcode } from '../../../src/lib/qrcode'
/* 对话机 */
import {
  conversationHandlers,
  setConversationState,
  deleteConversationState
} from '../../../src/lib/dialogue'
/** 统一引入机器人功能包 */
export {
  createPicture,
  createQrcode,
  conversationHandlers,
  setConversationState,
  deleteConversationState
}
