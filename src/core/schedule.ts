import schedule, { Job } from 'node-schedule'
import util from 'node:util'
interface test {
  job: Job
  cron: ''
  log: boolean
  name: string
  fnc: any
}

const task = []

export function creatTask(taskArr: test[]) {
  // 如果存在test
  if (process.argv[1].includes('test')) return
  // 循环创建
  taskArr.forEach((val: test) => {
    val.job = schedule.scheduleJob(val.cron, async () => {
      try {
        if (val.log === true) {
          console.info(`开始定时任务：${val.name}`)
        }
        let res = val.fnc()
        if (util.types.isPromise(res)) res = await res
        if (val.log === true) {
          console.info(`定时任务完成：${val.name}`)
        }
      } catch (error) {
        console.error(`定时任务报错：${val.name}`)
        console.error(error)
      }
    })
  })
}

export function collectTask(taskArr) {
  if (Array.isArray(taskArr)) {
    taskArr.forEach(val => {
      if (!val.cron) return
      if (!val.name) throw new Error('插件任务名称错误')
      task.push(val)
    })
  } else {
    if (taskArr.fnc && taskArr.cron) {
      if (!taskArr.name) throw new Error('插件任务名称错误')
      task.push(taskArr)
    }
  }
}
