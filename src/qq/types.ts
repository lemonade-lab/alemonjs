import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
export interface LoginConfigByQQ {
  appID: string
  token: string
  isPrivate: boolean
  intents: AvailableIntentsEventsEnum[]
  sandbox: boolean
  masterID?: string
  password?: string
}
