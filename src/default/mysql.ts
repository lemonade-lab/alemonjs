export default {
  host: process.env?.ALEMONJS_SQL_HOST ?? 'localhost',
  port: Number(process.env?.ALEMONJS_SQL_PORT ?? 3306),
  user: process.env?.ALEMONJS_SQL_USER ?? 'root',
  password: process.env?.ALEMONJS_SQL_PASSWORD ?? '',
  database: process.env?.ALEMONJS_SQL_DATABASE ?? 'alemonjs'
}
