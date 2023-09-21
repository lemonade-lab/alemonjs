process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
import { createBot } from './src/index.js'
await createBot(process.argv.slice(2))
