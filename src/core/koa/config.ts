import { BaseConfig } from '../config.js'
export const AppServerConfig = new BaseConfig<{
  port: number
  middleware: any[]
}>({
  port: 6010,
  middleware: []
})
