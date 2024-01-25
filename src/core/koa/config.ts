import cors from 'koa2-cors'
import { BaseConfig } from '../index.js'
export const AppServerConfig = new BaseConfig<{
  port: number
  options: cors.Options
}>({
  port: 6010,
  options: null
})