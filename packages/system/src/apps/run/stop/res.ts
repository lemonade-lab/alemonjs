import { getConfig, getIoRedis, Text, useObserver, useParse, useSend } from 'alemonjs'
import { Store } from '@src/model/store'
import pm2 from 'pm2'
import { lock } from '@src/model/lock'
export default OnResponse(
  async event => {
    const Send = useSend(event)
    if (event.IsMaster) {
      Send(Text('你不是主人'))
      return
    }

    // const ioRedis = getIoRedis()

    if (lock.value) {
      Send(Text('正在调控，请勿重复进行...'))
      return
    }

    const ioRedis = await getIoRedis()

    Send(Text('请再次发送，以确认关机'))

    const Observer = useObserver(event, 'message.create')

    Observer(
      async e => {
        const Send = useSend(e)
        //
        const Error = (err: any, msg?: string) => {
          lock.value = false
          if (err) console.error(err)
          if (msg) {
            console.error(msg)
            Send(Text(msg))
          }
          pm2.disconnect()
          // delete
          ioRedis.del(Store.RESTART_KEY)
        }

        const text = useParse(e.Megs, 'Text')

        if (/^#(停机|关机)$/.test(text)) {
          // 不是生产环境
          if (process.env?.NODE_ENV !== 'production') {
            await Send(Text('准备杀死进程...'))
            // 直接结束
            process.exit()
          }

          const cfg = getConfig()?.value

          if (!cfg.pm2.name) {
            Send(Text('未配置pm2.name'))
            return
          }

          // 查看情况
          pm2.connect(err => {
            if (err) {
              Error(err?.message, 'pm2出错')
              return
            }
            // 得到列表
            pm2.list(async (err, processList) => {
              if (err) {
                Error(err?.message, 'pm2 list 获取失败')
                return
              }
              //
              if (processList.length <= 0) {
                Error(undefined, 'pm2 进程配置为空, 你从未有pm2进程记录,无法使用')
                return
              }
              //
              const app = processList.find(p => p.name === cfg.pm2.apps[0].name)
              //
              if (!app) {
                Error(undefined, 'pm2 未匹配到进程配置，配置可能被修改了')
                return
              }
              pm2.stop(cfg.pm2.apps[0].name, () => {
                if (err) {
                  Error(err?.message, 'pm2 关闭')
                }
              })
            })
          })
        } else {
          Send(Text('已取消关机'))
        }
        close()
      },
      ['UserId']
    )

    //
  },
  'message.create',
  /^(#|\/)?(停机|关机)$/
)
