export default {
  host: process.env?.ALEMONJS_SERVER_HOST ?? 'localhost',
  port: Number(process.env?.ALEMONJS_SERVER_PORT) ?? 5000
}
