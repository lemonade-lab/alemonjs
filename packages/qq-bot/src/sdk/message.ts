import type { QQBotGroupEventMap } from './message.group'
import type { QQBotGuildEventMap } from './message.guild'
import { QQBotPublicEventMap } from './message.public'
export type QQBotEventMap = QQBotGroupEventMap & QQBotGuildEventMap & QQBotPublicEventMap
