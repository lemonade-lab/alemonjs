import { BaseConfig } from '../index.js'
export const AppServerConfig = new BaseConfig<{
  port: number
  middleware: any[]
}>({
  port: 6010,
  middleware: []
})
