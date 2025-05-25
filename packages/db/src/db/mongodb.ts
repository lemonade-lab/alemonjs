import mongoose from 'mongoose'
import { getConfigValue } from 'alemonjs'

type Config = {
  host?: string
  port?: string | number
  user?: string
  password?: string
  database?: string
}

/**
 * 获取 mongoose 实例
 * @param options
 * @returns
 */
export const getMongoose = ({
  config = {},
  options = {}
}: {
  config?: Config
  options?: mongoose.ConnectOptions
} = {}) => {
  if (global.mongoose) return global.mongoose
  const value = getConfigValue() || {}
  const mongodb = value?.mongodb || {}
  const { host, port, user, password, database } = config
  const connectConfig = {
    host: host || mongodb?.host || '127.0.1',
    port: port || mongodb?.port || 27017,
    user: user || mongodb?.user || '',
    password: password || mongodb?.password || '',
    database: database || mongodb?.database || 'alemonjs'
  }
  // 如果没有提供用户名和密码，则连接字符串不包含这些信息
  if (!user && !password) {
    global.mongoose = mongoose.connect(
      `mongodb://${connectConfig.host}:${connectConfig.port}/${connectConfig.database}`,
      {
        ...options
      }
    )
    return global.mongoose
  }
  // 如果提供了用户名和密码，则连接字符串包含这些信息
  global.mongoose = mongoose.connect(
    `mongodb://${connectConfig.user}:${connectConfig.password}@${connectConfig.host}:${connectConfig.port}/${connectConfig.database}`,
    {
      ...options
    }
  )
  return global.mongoose
}
