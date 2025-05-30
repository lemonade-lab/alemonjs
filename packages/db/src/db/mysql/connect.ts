import { mkdirSync } from 'fs'
import { join } from 'path'
import { Options, Sequelize } from 'sequelize'
import { getConfigValue } from 'alemonjs'
import { logging } from './utils'

type Config = {
  /**
   * MySQL 连接配置
   */
  uri?: string
  /**
   * MySQL 连接配置
   */
  host?: string
  /**
   * MySQL 连接端口
   */
  port?: number
  /**
   * MySQL 用户名
   */
  user?: string
  /**
   * MySQL 密码
   */
  password?: string
  /**
   * MySQL 数据库名称
   */
  database?: string
}

/**
 * @fileoverview MySQL 数据库连接模块
 * @module mysql
 * @returns
 */
export const getSequelize = (conifg: Config & Options = {}): Sequelize => {
  if (global.sequelize) return global.sequelize
  const dir = join(process.cwd(), 'logs', 'mysql')
  mkdirSync(dir, { recursive: true })
  const value = getConfigValue() || {}
  const { host, port, user, password, database, uri, ...options } = conifg
  const mysql = value?.mysql || {}
  const connectConfig = {
    host: host || mysql?.host || '127.0.0.1',
    port: port || mysql?.port || 3306,
    user: user || mysql?.user || 'root',
    password: password || mysql?.password || '',
    database: database || mysql?.database || 'alemonjs'
  }
  const url = uri || mysql?.uri || ''
  global.sequelize = new Sequelize(
    url ||
      `mysql://${connectConfig.user}:${connectConfig.password}@${connectConfig.host}:${connectConfig.port}/${connectConfig.database}`,
    {
      dialect: 'mysql',
      logging: logging,
      timezone: '+08:00',
      dialectOptions: {
        dialectOptions: 1,
        dateStrings: true
      },
      ...options
    }
  )
  return global.sequelize
}
