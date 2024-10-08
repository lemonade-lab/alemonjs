import { getConfig, Text, useParse, useSend, getIoRedis } from 'alemonjs'
import { Store } from '@src/model/store'
import pm2 from 'pm2'
import { lock } from '@src/model/lock'
const RESTART_TIME = 5 * 1000
export default OnResponse(
  async event => {
    const Send = useSend(event)
    if (event.IsMaster) {
      Send(Text('你不是主人'))
      return
    }

    if (lock.value) {
      Send(Text('正在调控，请勿重复进行...'))
      return
    }

    const ioRedis = await getIoRedis()

    /**
     * 时间锁
     */
    const time = await ioRedis.get(Store.RESTART_ACTION_KEY)
    if (time && Number(time) + RESTART_TIME > Date.now()) return
    await ioRedis.set(Store.RESTART_ACTION_KEY, Date.now().toString())

    // 执行锁
    lock.value = true

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

    // delete
    ioRedis.del(Store.RESTART_KEY)

    //
    const send = async () => {
      await Send(Text('开始重启...'))
    }

    const cfg = getConfig()?.value
    if (!cfg.pm2.name) {
      Send(Text('未配置pm2.name'))
      return
    }

    // text
    const text = useParse(event.Megs, 'Text')

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
          Error(
            undefined,
            '你从未有pm2进程记录,无法使用该功能。\n你需要执行pm2,确保该进程能正常进行。'
          )
          return
        }
        //
        const app = processList.find(p => p.name === cfg.pm2.apps[0].name)
        //
        if (!app) {
          Error(undefined, 'pm2 未匹配到进程配置，配置可能被修改了')
          return
        }
        // 记录重启
        await send()
        // 尝试重启
        pm2.restart(cfg.pm2.apps[0].name, async err => {
          if (err) {
            Error(err?.message, 'pm2 重启错误')
          } else {
            lock.value = false

            if (!/^控制台/.test(text)) {
              // 不是控制台重启，直接杀死当前进程
              process.exit()
            }

            // 打印记录
            pm2.launchBus((err, bus) => {
              if (err) {
                console.error(err)
                process.exit(2)
              }
              bus.on('log:out', packet => {
                if (packet?.data) console.log(packet.data)
              })
              bus.on('log:err', packet => {
                if (packet?.data) console.log(packet.data)
              })
            })

            //
          }
        })
      })
    })
  },
  'message.create',
  /^(#|\/)(控制台)?重启$/
)
