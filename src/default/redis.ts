export default {
  host: process.env?.ALEMONJS_REDIS_HOST ?? '127.0.0.1',
  port: Number(process.env?.ALEMONJS_REDIS_PORT ?? 6379),
  password: process.env?.ALEMONJS_REDIS_PASSWORD ?? '',
  db: Number(process.env?.ALEMONJS_REDIS_DB ?? 1)
}
