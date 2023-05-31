import express from 'express'
import { getData, AppName } from './img'
const app = express()
const port = 3000

/* 静态文件 */
app.use('/resources', express.static(`plugins/${AppName}/resources`))

/*  挂载 */
app.get('/', (req: any, res: any) => {
  let html = getData()
  res.send(html)
})

/* 监听 */
app.listen(port, () => {
  console.info(`http://127.0.0.1:${port}`)
})
