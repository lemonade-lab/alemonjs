import WebSocket from 'ws'
/**
 * 创建连接
 * @param options
 * @param fun
 */
export function createWsHandler(
  options: {
    url: string
    access_token?: string
  },
  fun: any
) {
  const { url, access_token } = options
  const socket = new WebSocket(
    url,
    access_token == '' || access_token == undefined
      ? {}
      : {
          headers: {
            ['Authorization']: `Bearer ${access_token}`
          }
        }
  )
  socket.on('open', () => {
    console.debug(`open：${url}`)
  })
  socket.on('message', data => {
    const event = JSON.parse(data.toString())
    if (event) {
      if (fun[event.type]) {
        fun[event.type](socket, event)
      } else {
        if (event?.status != 'ok') {
          console.log('[ONE]', event)
        }
      }
    }
  })
  socket.on('close', (code, reason) => {
    console.error(`${options.url} colse`)
    console.debug(`code:${code},reason:${reason.toString('utf8')}`)
  })
}
