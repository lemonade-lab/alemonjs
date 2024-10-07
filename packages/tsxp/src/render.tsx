import React from 'react'
import { Picture } from './picture.js'
import { ComponentCreateOpsionType, ObtainProps, ScreenshotFileOptions } from './types.js'
class ScreenshotPicture extends Picture {
  constructor() {
    // 继承实例
    super()
    // 启动
    this.Pup.start()
  }
}
let puppeteer: typeof ScreenshotPicture.prototype = null
/**
 * 得到一个 puppeteer 实例
 * @returns
 */
export const Render = () => {
  if (!puppeteer) puppeteer = new ScreenshotPicture()
  return puppeteer
}
// 队列
const queue: {
  ComOptions: ComponentCreateOpsionType
  PupOptions?: ScreenshotFileOptions
  resolve: Function
  reject: Function
}[] = []
// 标志
let isProcessing = false
/**
 * 处理队列
 * @returns
 */
const processQueue = async () => {
  if (queue.length === 0) {
    isProcessing = false
    return
  }
  // 设置标志
  isProcessing = true
  // 得到队列中的第一个任务
  const { ComOptions, PupOptions, resolve, reject } = queue.shift()
  try {
    const img = await puppeteer.screenshot(ComOptions, PupOptions)
    // 完成任务
    resolve(img)
  } catch (error) {
    console.error(error)
    // 拒绝任务
    reject(false)
  }
  // 处理下一个任务
  processQueue()
}
/**
 * 渲染组件为图片
 * @param htmlPath
 * @param options
 */
export const render = async (
  ComOptions: ComponentCreateOpsionType,
  PupOptions?: ScreenshotFileOptions
): Promise<Buffer | false> => {
  // 如果 puppeteer 尚未初始化，则进行初始化
  if (!puppeteer) puppeteer = new ScreenshotPicture()
  // 返回一个 Promise
  return new Promise((resolve, reject) => {
    // 将任务添加到队列
    queue.push({ ComOptions, PupOptions, resolve, reject })
    // 如果没有任务正在进行，则开始处理队列
    if (!isProcessing) {
      processQueue()
    }
  })
}

/**
 * 对组件 map 进行合并渲染
 * @param Components
 * @returns
 */
export const renders = <
  ComponentsType extends Record<string, React.FC<any> | React.ComponentClass<any>>
>(
  Components: ComponentsType
): (<TKey extends keyof ComponentsType>(
  key: TKey,
  options: ObtainProps<ComponentsType[TKey]>,
  name?: string
) => Promise<false | Buffer>) => {
  return async (key, props, name) => {
    // 选择组件
    const MyComponent = Components[key]
    const k = String(key)
    // 确保 MyComponent 是有效的组件
    if (!MyComponent) {
      throw new Error(`Component with key "${k}" does not exist.`)
    }
    // 截图
    return render({
      join_dir: k,
      html_name: `${name ?? k}.html`,
      html_body: <MyComponent {...props} />
    })
  }
}
