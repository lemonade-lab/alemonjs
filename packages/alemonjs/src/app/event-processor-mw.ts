/**
 * @fileoverview 消息处理快
 * 登录模块向核心模块发送数据
 * 核心模块调用模块索引
 * @module processor
 * @author ningmengchongshui
 */
import { AEvents } from '../env'
import { MWStore } from './store'

/**
 *
 * @param event
 * @param key
 */
export const expendMiddleware = async <T extends keyof AEvents>(event: AEvents, key: T) => {
  // 得到所有 apps
  const mwFiles = [...global.MWFiles]
  // 得到对应类型的消息
  const mws = [...MWStore[key]]

  let valueI = 0
  let valueJ = 0

  /**
   * 下一步
   * @returns
   */
  const next = async () => {
    // i 结束了
    if (valueI >= mwFiles.length) {
      // j 结束了
      if (valueJ >= mws.length) {
        return
      }
      // 走 j，检查所有分毫类型的
      await callj()
      return
    }
    // 走 i，检查所有 apps
    await calli()
  }

  /**
   * 执行 i
   * @returns
   */
  const calli = async () => {
    // 调用完了
    if (valueI >= mwFiles.length) {
      // 开始调用j
      await next()
      return
    }
    valueI++
    const file = mwFiles[valueI - 1]
    if (!file?.path) {
      // 继续
      await next()
      return
    }

    try {
      const obj = await import(`file://${file.path}`)
      const res = obj?.default
      if (res?.event !== key) {
        // 继续
        await next()
        return
      }
      const valueKey = {
        dir: file?.dir,
        path: file.path,
        name: file.name,
        value: {
          event: res?.event ?? key
        }
      }
      // 推送, 确保下次直接流向 key ，不再从头开始
      if (!MWStore[key].find(v => v.path === file.path)) {
        // update files and values
        const index = global.MWFiles.findIndex(v => v.path === file.path)
        global.MWFiles.splice(index, 1)
        MWStore[key].push(valueKey)
      }
      // 这里是否继续时 next 说了算
      event = await res?.callback(event, { next, reg: res.reg })
    } catch (err) {
      // 不再继续
      logger.error(err)
    }
  }

  const callj = async () => {
    // 调用完了
    if (valueJ >= mws.length) {
      return
    }
    valueJ++
    const file = mws[valueJ - 1]
    if (!file?.path) {
      await next()
      return
    }
    try {
      if (!file.value) {
        const obj = await import(`file://${file.path}`)
        const res = obj?.default
        // 这里是否继续时 next 说了算
        event = await res?.callback(event, { next })
      } else {
        const obj = await import(`file://${file.path}`)
        const res = obj?.default
        // 这里是否继续时 next 说了算
        event = res?.callback(event, { next })
      }
    } catch (err) {
      logger.error(err)
    }
    //
  }

  // 开始修正模式
  await next()

  return event
}
