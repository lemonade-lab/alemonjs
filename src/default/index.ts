export const DefaultConfig = {
  mysql: {
    host: process.env?.ALEMONJS_SQL_HOST ?? 'localhost',
    port: Number(process.env?.ALEMONJS_SQL_PORT ?? 3306),
    user: process.env?.ALEMONJS_SQL_USER ?? 'root',
    password: process.env?.ALEMONJS_SQL_PASSWORD ?? '',
    database: process.env?.ALEMONJS_SQL_DATABASE ?? 'alemonjs'
  },
  redis: {
    host: process.env?.ALEMONJS_REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env?.ALEMONJS_REDIS_PORT ?? 6379),
    password: process.env?.ALEMONJS_REDIS_PASSWORD ?? '',
    db: Number(process.env?.ALEMONJS_REDIS_DB ?? 1)
  },
  server: {
    host: process.env?.ALEMONJS_SERVER_HOST ?? 'localhost',
    port: Number(process.env?.ALEMONJS_SERVER_PORT) ?? 5000
  },
  email: {
    smt: {
      // 平台
      service: 'qq',
      // 账号密码
      auth: {
        user: '',
        pass: ''
      }
    },
    to: ''
  }
}
export * from './types.js'
