import https from 'https'
import http from 'http'
import url from 'url'
// import querystring from 'querystring'

const port = 25660

let server: http.Server

export function fetchHtml(url) {
  let module

  // 根据URL选择协议
  if (url.startsWith('https://')) {
    module = https
  } else if (url.startsWith('http://')) {
    module = http
  } else {
    return Promise.reject(new Error('Invalid URL: URL must start with http:// or https://'))
  }

  return new Promise((resolve, reject) => {
    // 发送 HTTP GET 请求
    module
      .get(url, resp => {
        let data = ''

        // 接收数据块
        resp.on('data', chunk => {
          data += chunk
        })

        // 请求结束
        resp.on('end', () => {
          resolve(data)
        })
      })
      .on('error', err => {
        reject(err)
      })
  })
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*') // 允许所有来源的跨域请求
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS') // 允许的 HTTP 方法
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization') // 允许的请求头
  // 如果需要处理预检请求（OPTIONS），可以添加以下行来返回 204 状态码
  // if (req.method === 'OPTIONS') {
  //   res.statusCode = 204;
  //   res.end();
  //   return;
  // }
}

// 貌似没效果
// const intercetorScript = (url = 'cap_union_new_verify|cap_union_prehandle') => `
// <script>
// // 拦截请求
// (function() {
//     // 保存原始的 XMLHttpRequest 对象
//     var originalXHR = window.XMLHttpRequest;

//     // 自定义 XMLHttpRequest 构造函数
//     function CustomXHR() {
//         var xhrInstance = new originalXHR();

//         var open = xhrInstance.open

//         xhrInstance.open = function(method, url, async, user, password) {
//             this._url = url;
//             // const proxyUrl = 'http://127.0.0.1:25660/proxy=${encodeURIComponent(url)}'
//             // open.call(this, method, proxyUrl, async, user, password);
//             return originalXHR.prototype.open.apply(this, arguments);
//         };

//         var originalOnReadyStateChange = xhrInstance.onreadystatechange;
//         xhrInstance.onreadystatechange = function() {
//             // 检查请求是否完成
//             if (xhrInstance.readyState === 4) {
//                 // 在这里处理请求结果
//                 // console.log('Intercepted AJAX response:', xhrInstance.responseText);
//                 window.parent.postMessage(xhrInstance.responseText,'*')
//                 // if(this._url && /${url}/.test(this._url)) {

//                 // }

//                 // 如果需要，可以调用原始的 onreadystatechange 方法
//                 if (typeof originalOnReadyStateChange === 'function') {
//                     originalOnReadyStateChange.apply(xhrInstance);
//                 }

//                 // 可以在这里添加额外的逻辑，比如修改响应文本或阻止默认行为
//                 // 例如，如果响应包含特定错误消息，可以抛出异常或显示错误提示
//             }
//         };

//         return xhrInstance;
//     }

//     // 覆盖全局的 XMLHttpRequest 对象
//     window.XMLHttpRequest = CustomXHR;
//     const originalFetch = window.fetch;

//     window.fetch = async function(url, options) {
//         console.log('Intercepted fetch:', url, options);
//         return originalFetch.apply(this, arguments);
//     };
// })();
// </script>
// `

const intercetorScript = `
<script>
    function captchaCallback(res) {
        var fromWx = getQueryParam('fromWx');
        if (fromWx) {
            loadScript('https://res.wx.qq.com/open/js/jweixin-1.3.2.js', function () {
                window.wx.miniProgram.postMessage({ data: { res: res } });
                window.wx.miniProgram.navigateBack();
            }, function () {
                reportError('wxJsLoadError');
            });

            return;
        }
        // 如果来着老PCQQ
        if (fromOldPC) {
            if (res.ret !== 0) {
                oldPcCallNative("NotifyStartEditContent", '{"result":"1"}');
                return;
            }
            oldPcCallNative("NotifyStartEditContent", '{"result":"0","ticket":"' + res.ticket + '","randstr":"' + res.randstr + '"}');
            return;
        }
        window.parent.postMessage({
            result: '0',
            appid: res.appid,
            ticket: res.ticket, // 校验码
            randstr: res.randstr // 随机码
        },'*')
        // 获取的ticket传给客户端
        window.mqq.invoke('CAPTCHA', 'onVerifyCAPTCHA', {
            result: '0',
            appid: res.appid,
            ticket: res.ticket, // 校验码
            randstr: res.randstr // 随机码
        });
    }
</script>
`

/**
 * 启动服务
 */
export function startServer() {
  try {
    if (server) return
    server = http.createServer(async (req, res) => {
      setCorsHeaders(res)
      const parsedUrl = url.parse(req.url, true) // 第二个参数 true 表示解析查询字符串
      const query = parsedUrl.query

      if (/^\/captcha/.test(req.url)) {
        console.log(query.url)
        const captchaUrl = decodeURIComponent((query?.url as string) || '')
        let htmlContent = (await fetchHtml(captchaUrl)) as string

        let headCloseIndex = htmlContent.indexOf('</html>')
        if (headCloseIndex !== -1) {
          htmlContent =
            htmlContent.slice(0, headCloseIndex) +
            intercetorScript +
            htmlContent.slice(headCloseIndex)
        } else {
          console.error('未找到</html>标签，无法插入脚本。')
        }

        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(htmlContent)
      }
    })

    // 让服务器监听一个端口（例如 3000）
    server.listen(port, () => {
      console.log(`[icqq]server.listener: http://127.0.0.1:${port}/captcha`)
    })
  } catch (err) {
    console.warn('验证服务器启动失败：', err)
    server = null
  }
}

/**
 * 关闭服务
 */
export function stopServer() {
  if (server) {
    server.close(() => {
      console.debug('Icqq.Captcha.Server has been stopped.')
      server = null
    })
  } else {
    // console.error('No server instance to stop.');
  }
}
