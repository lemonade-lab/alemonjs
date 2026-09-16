// Adapted from karin-plugin-adapter-douyin (MIT); see THIRD_PARTY_NOTICES.md.
/** IM 协议底层：编解码、WS 传输（消息业务层见上层模块） */

export { loadRoot, IM_PROTO_SOURCE } from './proto.js';
export { encodeRequest, decodeResponseRaw, type EncodeRequestOptions } from './codec.js';
export { decodeWire, decodeWireTree, encodeVarint, fieldVarint, fieldBytes, fieldStringValue, kv, type WireField, type WireTreeField } from './wire.js';
export {
  AndroidFrontierWs,
  buildAndroidFrontierUrl,
  reconnectDelay,
  cookieValue,
  ANDROID_APP_KEY,
  ANDROID_ACCESS_SALT,
  ANDROID_UA,
  ANDROID_SDK_VERSION,
  type AndroidFrontierWsOptions,
  type AndroidFrontierWsCallbacks,
  type WsReconnectEvent,
  type WsCloseEvent
} from './ws.js';
