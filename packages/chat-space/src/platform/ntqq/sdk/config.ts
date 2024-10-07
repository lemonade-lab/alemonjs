import { BaseConfig } from '../../../core/config.js'
import { IntentsEnum } from './intents.js'

export const config = new BaseConfig<{
  appID: string
  token: string
  secret: string
  intents: IntentsEnum[]
  isPrivate?: boolean
  sandbox?: boolean
  shard?: number[]
}>({
  appID: '',
  token: '',
  secret: '',
  intents: ['GROUP_AT_MESSAGE_CREATE', 'C2C_MESSAGE_CREATE'],
  isPrivate: false,
  sandbox: false,
  shard: [0, 1]
})
