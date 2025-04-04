import { BaseConfig } from './core/config.js'
import { AvailableIntentsEventsEnum } from './types.js'
import { DISOCRDOptions } from './wss.types.js'
export const config = new BaseConfig<DISOCRDOptions>({
  token: '',
  intent: AvailableIntentsEventsEnum,
  shard: [0, 1]
})
