const adr = window.location.origin.replace(/^(http|https)/, '')
const socket = new WebSocket('ws' + adr + '/ws')
socket.onopen = function () {}
socket.onmessage = function (event) {
  const message = JSON.parse(event.data)
  if (window.location.pathname == message.url) {
    if (message.url.endsWith('.vue') || message.url.endsWith('.html')) {
      socket.close()
      window.location.reload()
    }
  }
}
socket.onclose = function (event) {}
socket.onerror = function (error) {}
console.log('调节设备工具(机器人图片截图尺寸):800*960')
