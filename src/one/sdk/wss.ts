import ws, { WebSocket } from 'ws'

let socket: WebSocket

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
  socket = new ws(
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
        fun[event.type](event)
      } else {
        if (event?.status != 'ok') {
          console.info('[ONE]', event)
        }
      }
    }
  })
  socket.on('close', (code, reason) => {
    console.error(`${options.url} colse`)
    console.debug(`code:${code},reason:${reason.toString('utf8')}`)
  })
}

export const ClientONE = socket
