import { BaseBotMessage } from '../../../core/index.js'
export const BotMessage = new BaseBotMessage<{
  id: string
  name: string
  avatar?: string
}>({
  id: '',
  name: '',
  avatar: ''
})
