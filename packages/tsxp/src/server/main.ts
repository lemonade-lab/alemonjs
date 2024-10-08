import { createServer } from './index.js'
// tsx-server
if (process.argv.includes('--tsxp-server')) {
  const index = process.argv.indexOf('--port')
  const portStr = index > -1 ? process.argv[index + 1] : undefined
  const port = Number(portStr) || 3000
  createServer({
    port
  })
}
