import type { QQBotGroupEventMap } from './message.group'
import type { QQBotGuildEventMap } from './message.guild'
export type QQBotEventMap = QQBotGroupEventMap & QQBotGuildEventMap
