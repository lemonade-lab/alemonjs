import { createServer } from './index.js'
// tsx-server
if (process.argv.includes('--tsxp-server')) {
  const portStr = process.argv[process.argv.indexOf('--port') + 1]
  const port = Number(portStr) || 3000
  createServer({
    port
  })
}
