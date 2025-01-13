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
  if (!value) {
    throw new Error('config.json not found')
  }
  const mysql = value.mysql
  if (!mysql) {
    throw new Error('mysql is null')
  }
  const sequelize = new Sequelize(
    `mysql://${mysql.user}:${mysql.password}@${mysql.host}:${mysql.port}/${mysql.database}`,
    {
      dialect: 'mysql',
      logging: logging
    }
  )
  global.sequelize = sequelize
  return global.sequelize
}
