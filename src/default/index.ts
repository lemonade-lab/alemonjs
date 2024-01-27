export const DefaultMysqlOptions = {
  host: process.env?.ALEMONJS_SQL_HOST ?? 'localhost',
  port: Number(process.env?.ALEMONJS_SQL_PORT ?? 3306),
  user: process.env?.ALEMONJS_SQL_USER ?? 'root',
  password: process.env?.ALEMONJS_SQL_PASSWORD ?? '',
  database: process.env?.ALEMONJS_SQL_DATABASE ?? 'alemonjs'
}

export const DefaultRedisOptions = {
  host: process.env?.ALEMONJS_REDIS_HOST ?? '127.0.0.1',
  port: Number(process.env?.ALEMONJS_REDIS_PORT ?? 6379),
  password: process.env?.ALEMONJS_REDIS_PASSWORD ?? '',
  db: Number(process.env?.ALEMONJS_REDIS_DB ?? 1)
}

export * from './types.js'
