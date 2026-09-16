// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
/** IM 消息业务层：WS 收发、媒体上传、通知、接收器与门面（协议底层见 protocol/） */

export * from './types.js';
export {
  parseMessageContent,
  displayText,
  buildLegacyTextContent,
  buildCreatorTextContent,
  buildDesktopTextContent,
  buildImageContent,
  buildVideoContent,
  buildFileContent,
  buildReplyPayload,
  normalizeTextMessageContent,
  normalizeDesktopTextMessageContent,
  type ImageAsset,
  type FileAssetPayload,
  type TextMention,
  type ReplyMessageOptions,
  type ReplyPayload
} from './content.js';
export {
  isGroupConversationId,
  parsePeerFromConversationId,
  dedupeThreads,
  mapProtoConversation,
  mapProtoConversationMeta,
  mapProtoConversationListItem,
  mapProtoMessage,
  mapThreadToFriend,
  mapThreadToStranger
} from './mappers.js';
export { DESKTOP_PC_UA, desktopFingerprintParams, ImProtoTransport } from './transport.js';
export {
  recall,
  listCookieThreads,
  listStrangerThreads,
  listConversations,
  getFriendList,
  getGroupList,
  getGroupMembers,
  getStrangerList,
  getChatHistory,
  getFriendRequests,
  getGroupJoinRequests,
  reviewFriendRequest,
  reviewGroupJoinRequest,
  setGroupName,
  actionResponse,
  type InboxContext,
  type InboxListOptions
} from './inbox.js';
export {
  send,
  sendText,
  sendImage,
  sendVideo,
  sendFile,
  reply,
  type SendContext,
  type SendMediaOptions,
  type SendVideoOptions,
  type SendFileOptions,
  type ReplyOptions
} from './send.js';
export {
  pickImageUrl,
  decryptImage,
  decryptCencSample,
  sniffImageFormat,
  type ImageResource,
  type VideoResource,
  type CencSubsample,
  type ImageFormat,
  type LinkCard,
  type UserCard,
  type FileAsset
} from './media.js';
export {
  ImMediaUploader,
  canonicalUploadQuery,
  crc32Hex,
  signVodRequest,
  uploadProcessFunctions,
  type UploadCredentials,
  type VideoAsset,
  type FileUploadAsset,
  type VodSignature
} from './upload.js';
export { noticeFromPush, extractAndroidNotices } from './notifications.js';
export { toInboundMessage, extractAndroidPushes } from './receiver.js';
export { ImClient, type ImClientOptions, type ImClientEvent, type ImClientEventMap, type SendMediaItem } from './client.js';
