import { defineAlemonConfig } from './src/index.js'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

export default defineAlemonConfig({
  login: {},
  app: {
    init: false
  }
})
