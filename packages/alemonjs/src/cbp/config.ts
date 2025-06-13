/**
 * CBP: Chatbot Protocol
 * @description 聊天机器人协议
 *
 *              转发&格式化               格式化                   原始
 * AL Clinet  <---------> CBP(server) <---------> AL Platform  <---------> Platform(server)
 *               行为                    转发&行为                行为API
 *               请求                    转发&请求                请求API
 *
 * CBP server 只允许 AL Platform 存在一个连接。允许 多个 AL Client 连接。
 * AL Client 默认全量接收消息。也可以进行进入分流模式
 *
 */
import { WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import { Result } from '../post'
// 子客户端
export const childrenClient = new Map<string, WebSocket>()
// 平台客户端
export const platformClient = new Map<string, WebSocket>()
// 全量客户端
export const fullClient = new Map<string, WebSocket>()
export const deviceId = uuidv4()
// 连接类型
export const USER_AGENT_HEADER = 'user-agent'
// 设备 ID
export const DEVICE_ID_HEADER = 'x-device-id'
// 是否全量接收
export const FULL_RECEIVE_HEADER = 'x-full-receive'
// 行为回调
export const actionResolves = new Map<string, (value: Result[] | PromiseLike<Result[]>) => void>()
// 接口回调
export const apiResolves = new Map<string, (value: Result[] | PromiseLike<Result[]>) => void>()
// 超时器
export const actionTimeouts = new Map<string, NodeJS.Timeout>()
// 接口超时器
export const apiTimeouts = new Map<string, NodeJS.Timeout>()
// 分配绑定记录
export const childrenBind = new Map<string, string>()
// 生成唯一标识符
export const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}
// 超时时间
export const timeoutTime = 1000 * 12 // 12秒
// 失败重连
export const reconnectInterval = 1000 * 6 // 6秒
// 心跳间隔
export const HEARTBEAT_INTERVAL = 1000 * 18 // 18秒
