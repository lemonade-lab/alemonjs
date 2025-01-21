import { createRequire } from 'module'
const require = createRequire(import.meta.url)
/**
 * @param data
 */
export const processSend = (data: { type: string; data: any }) => {
  // 如果使用了ws替代了process
  if (global.wsprocess && global.wsprocess.send) {
    global.wsprocess.send(data)
  } else {
    const process = require('process')
    process.send(data)
  }
}

/**
 * @param message
 * @param typing
 * @returns
 */
export const sendNotification = (
  message: string,
  typing: 'error' | 'warning' | 'default' = 'default'
) => {
  return processSend({
    type: 'notification',
    data: {
      value: message,
      typing
    }
  })
}

/**
 * @param data
 */
export const sendActionApplicationSidebarLoad = (data: any) => {
  processSend({
    type: 'action:application:sidebar:load',
    data: data
  })
}

/**
 *
 * @param data
 */
export const sendWebviewOnMessage = (data: any) => {
  processSend({
    // 丢给 on message
    type: 'webview-on-message',
    // 传入数据
    data
  })
}

/**
 *
 * @param data
 */
export const sendWebviewOnExpansionsMessage = (data: any) => {
  processSend({
    type: 'webview-on-expansions-message',
    data: data
  })
}

/**
 *
 * @param data
 */
export const sendGetExpansions = (data: any[]) => {
  processSend({
    type: 'get-expansions',
    data: data
  })
}

/**
 *
 * @param data
 */
export const sendGitClone = (data: number) => {
  processSend({
    type: 'git-clone',
    data
  })
}
