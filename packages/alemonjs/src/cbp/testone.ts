import { IncomingMessage } from 'http'
import { WebSocket } from 'ws'
import * as flattedJSON from 'flatted'
import { ParsedMessage } from './typings'
import { onProcessor } from '../app/event-processor'
import { dirname, join } from 'path'
import { existsSync, readFileSync, watch, mkdirSync } from 'fs'
import _ from 'lodash'
import { readFile } from 'fs/promises'
import { actionResolves, actionTimeouts, apiResolves, apiTimeouts } from './config'
import { createResult } from '../post'
import { ResultCode } from '../core/code'

/**
 * @param ws
 * @param request
 */
export const connectionTestOne = (ws: WebSocket, _request: IncomingMessage) => {
  if (global.testoneClient) {
    delete global.testoneClient
  }
  global.testoneClient = ws

  // 确保目录存在
  const testonePath = join(process.cwd(), 'testone')
  if (!existsSync(testonePath)) {
    mkdirSync(testonePath, { recursive: true })
  }

  const fileWatchers = new Map<string, any>()

  // 通用的文件监听函数
  const watchFile = (filePath: string, _type: string, handler: () => void) => {
    try {
      // 如果文件存在，直接监听
      if (existsSync(filePath)) {
        const watcher = watch(filePath, { persistent: true }, (eventType, filename) => {
          if (eventType === 'change' && filename) {
            handler()
          }
        })
        fileWatchers.set(filePath, watcher)
      }
    } catch (error) {
      console.error(`监听文件失败: ${filePath}`, error)
    }
  }

  // 监听整个目录，捕获新文件创建
  const dirWatcher = watch(testonePath, { persistent: true }, (eventType, filename) => {
    if (!filename) return
    const filePath = join(testonePath, filename)
    // 如果是新创建的文件，开始监听它
    if (eventType === 'rename' && existsSync(filePath) && !fileWatchers.has(filePath)) {
      if (filename === 'commands.json') {
        watchFile(filePath, 'commands', onCommands)
        onCommands() // 立即触发一次
      } else if (filename === 'users.json') {
        watchFile(filePath, 'users', onUsers)
        onUsers()
      } else if (filename === 'channels.json') {
        watchFile(filePath, 'channels', onChannels)
        onChannels()
      }
    }
  })

  const commandsPath = join(testonePath, 'commands.json')
  const onCommands = _.debounce(() => {
    if (!existsSync(commandsPath)) return
    readFile(commandsPath, 'utf-8')
      .then(data => {
        const commands = JSON.parse(data)
        global.testoneClient?.send(
          flattedJSON.stringify({
            type: 'commands',
            payload: commands
          })
        )
      })
      .catch(error => {
        console.error('读取 commands.json 失败:', error)
      })
  }, 1000)

  const usersPath = join(testonePath, 'users.json')
  const onUsers = _.debounce(() => {
    if (!existsSync(usersPath)) return
    readFile(usersPath, 'utf-8')
      .then(data => {
        const users = JSON.parse(data)
        global.testoneClient?.send(
          flattedJSON.stringify({
            type: 'users',
            payload: users
          })
        )
      })
      .catch(error => {
        console.error('读取 users.json 失败:', error)
      })
  }, 1000)

  const channelsPath = join(testonePath, 'channels.json')
  const onChannels = _.debounce(() => {
    if (!existsSync(channelsPath)) return
    readFile(channelsPath, 'utf-8')
      .then(data => {
        const channels = JSON.parse(data)
        global.testoneClient?.send(
          flattedJSON.stringify({
            type: 'channels',
            payload: channels
          })
        )
      })
      .catch(error => {
        console.error('读取 channels.json 失败:', error)
      })
  }, 1000)

  // 初始化时监听已存在的文件
  watchFile(commandsPath, 'commands', onCommands)
  watchFile(usersPath, 'users', onUsers)
  watchFile(channelsPath, 'channels', onChannels)

  const userPath = join(testonePath, 'user.json')
  const botPath = join(testonePath, 'bot.json')
  const privateMessagePath = join(testonePath, '.cache', 'private.message.json')
  const publicMessagePath = join(testonePath, '.cache', 'public.message.json')

  const cacheDir = dirname(privateMessagePath)
  mkdirSync(cacheDir, { recursive: true })

  const initData = () => {
    try {
      const commandsData = existsSync(commandsPath)
        ? JSON.parse(readFileSync(commandsPath, 'utf-8'))
        : []
      const usersData = existsSync(usersPath) ? JSON.parse(readFileSync(usersPath, 'utf-8')) : []
      const channelsData = existsSync(channelsPath)
        ? JSON.parse(readFileSync(channelsPath, 'utf-8'))
        : []
      const userData = existsSync(userPath) ? JSON.parse(readFileSync(userPath, 'utf-8')) : null
      const botData = existsSync(botPath) ? JSON.parse(readFileSync(botPath, 'utf-8')) : null
      const privateMessage = existsSync(privateMessagePath)
        ? JSON.parse(readFileSync(privateMessagePath, 'utf-8'))
        : []
      const publicMessage = existsSync(publicMessagePath)
        ? JSON.parse(readFileSync(publicMessagePath, 'utf-8'))
        : []
      global.testoneClient?.send(
        flattedJSON.stringify({
          type: 'init.data',
          payload: {
            commands: commandsData,
            users: usersData,
            channels: channelsData,
            user: userData,
            bot: botData,
            privateMessage: privateMessage,
            publicMessage: publicMessage
          }
        })
      )
    } catch (error) {
      console.error('初始化数据失败:', error)
    }
  }

  // 处理消息事件
  global.testoneClient.on('message', (message: string) => {
    try {
      // 解析消息
      const parsedMessage: ParsedMessage = flattedJSON.parse(message.toString())
      // 如果是一个对象，且有 name 属性，说明是一个事件请求
      if (parsedMessage.name) {
        // 如果有 name，说明是一个事件请求。要进行处理
        onProcessor(parsedMessage.name, parsedMessage as any, parsedMessage.value as any)
      } else if (parsedMessage?.actionId) {
        // 如果有 actionId
        const resolve = actionResolves.get(parsedMessage.actionId)
        if (resolve) {
          actionResolves.delete(parsedMessage.actionId)
          // 清除超时器
          const timeout = actionTimeouts.get(parsedMessage.actionId)
          if (timeout) {
            actionTimeouts.delete(parsedMessage.actionId)
            clearTimeout(timeout)
          }
          // 调用回调函数
          if (Array.isArray(parsedMessage.payload)) {
            resolve(parsedMessage.payload)
          } else {
            // 错误处理
            resolve([createResult(ResultCode.Fail, '消费处理错误', null)])
          }
        }
      } else if (parsedMessage?.apiId) {
        // 如果有 apiId，说明是一个接口请求。要进行处理
        const resolve = apiResolves.get(parsedMessage.apiId)
        if (resolve) {
          apiResolves.delete(parsedMessage.apiId)
          // 清除超时器
          const timeout = apiTimeouts.get(parsedMessage.apiId)
          if (timeout) {
            apiTimeouts.delete(parsedMessage.apiId)
            clearTimeout(timeout)
          }
          // 调用回调函数
          if (Array.isArray(parsedMessage.payload)) {
            resolve(parsedMessage.payload)
          } else {
            // 错误处理
            resolve([createResult(ResultCode.Fail, '接口处理错误', null)])
          }
        }
      } else if (parsedMessage.type === 'init.data') {
        initData()
      } else if (parsedMessage.type === 'commands') {
        onChannels()
      } else if (parsedMessage.type === 'users') {
        onUsers()
      } else if (parsedMessage.type === 'channels') {
        onChannels()
      }
    } catch (error) {
      console.error('客户端解析消息失败:', error)
    }
  })

  // 处理关闭事件
  global.testoneClient.on('close', () => {
    console.log('WebSocket connection closed')
    // 清理所有文件监听器
    fileWatchers.forEach(watcher => watcher.close())
    fileWatchers.clear()
    dirWatcher.close()
  })
}
