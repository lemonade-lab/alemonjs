import { mkdirSync } from 'fs'
import { join } from 'path'
import { Sequelize } from 'sequelize'
import { getConfigValue } from 'alemonjs'
import { logging } from './utils'
export const getSequelize = () => {
  if (global.sequelize) return global.sequelize
  const dir = join(process.cwd(), 'logs', 'mysql')
  mkdirSync(dir, { recursive: true })
  const value = getConfigValue()
  if (!value) throw new Error('getConfigValue is null')
  const config = {
    host: value?.mysql?.host ?? '127.0.0.1',
    port: value?.mysql?.port ?? 3306,
    user: value?.mysql?.user ?? 'root',
    password: value?.mysql?.password ?? 'Mm002580!',
    database: value?.mysql?.database ?? 'alemonjs'
  }
  const sequelize = new Sequelize(
    `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`,
    {
      dialect: 'mysql',
      logging: logging
    }
  )
  global.sequelize = sequelize
  return global.sequelize
}
