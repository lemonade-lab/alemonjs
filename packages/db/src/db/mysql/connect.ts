import { mkdirSync } from 'fs'
import { join } from 'path'
import { Sequelize } from 'sequelize'
import { getConfigValue } from 'alemonjs'
import { logging } from './utils'

type Config = {
  host?: string
  port?: number
  user?: string
  password?: string
  database?: string
}

/**
 * @fileoverview MySQL 数据库连接模块
 * @module mysql
 * @returns
 */
export const getSequelize = (conifg: Config = {}): Sequelize => {
  if (global.sequelize) return global.sequelize
  const dir = join(process.cwd(), 'logs', 'mysql')
  mkdirSync(dir, { recursive: true })
  const value = getConfigValue() || {}
  const { host, port, user, password, database } = conifg
  const mysql = value?.mysql || {}
  const connectConfig = {
    host: host || mysql?.host || '127.0.0.1',
    port: port || mysql?.port || 3306,
    user: user || mysql?.user || 'root',
    password: password || mysql?.password || '',
    database: database || mysql?.database || 'alemonjs'
  }
  global.sequelize = new Sequelize(
    `mysql://${connectConfig.user}:${connectConfig.password}@${connectConfig.host}:${connectConfig.port}/${connectConfig.database}`,
    {
      dialect: 'mysql',
      logging: logging
    }
  )
  return global.sequelize
}
