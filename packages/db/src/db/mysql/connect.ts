import { Options, Sequelize } from 'sequelize'
import { initLogPath, logging } from './utils'
import { getMysqlConfig } from '../../config'

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
  initLogPath()
  const mysql = getMysqlConfig()
  const { host, port, user, password, database, uri, ...options } = conifg
  const baseConfig = {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'alemonjs'
  }
  const connectConfig = {
    host: host || mysql?.host || baseConfig.host,
    port: port || mysql?.port || baseConfig.port,
    user: user || mysql?.user || baseConfig.user,
    password: password || mysql?.password || baseConfig.password,
    database: database || mysql?.database || baseConfig.database
  }
  const url = uri || mysql?.uri || ''
  global.sequelize = new Sequelize(
    url ||
      `mysql://${connectConfig.user}:${connectConfig.password}@${connectConfig.host}:${connectConfig.port}/${connectConfig.database}`,
    {
      dialect: 'mysql',
      logging: logging,
      timezone: '+08:00',
      ...options
    }
  )
  return global.sequelize
}
