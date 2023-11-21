import { defineAlemonConfig } from './src/index.js'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

export default defineAlemonConfig({
  login: {
    ntqq: {
      appID: '102073820',
      token: 'Swaz1ElxZyYeGCyYptf5GIF0fKM9JTtt',
      secret: 'FORL8l9MOBkAPUKw',
      mode: 'qq'
    }
  },
  app: {
    init: false
  }
})
