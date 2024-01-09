import { BaseBotMessage } from '../../core/index.js'
interface BotMessageType {
  id: string
  name: string
  avatar?: string
}
export const BotMessage = new BaseBotMessage<BotMessageType>({
  id: '',
  name: '',
  avatar: ''
})
