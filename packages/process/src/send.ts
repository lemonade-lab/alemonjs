export const processSend = (data: { type: string; data: any }) => {
  process.send(data)
}

/**
 *
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
export const sendWebviewPostMessage = (data: any) => {
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
export const sendWebviewGetExpansions = (data: any) => {
  processSend({
    type: 'webview-get-expansions',
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
