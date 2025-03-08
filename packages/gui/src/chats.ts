import * as fs from 'fs'
import { channelPath, privatePath } from './file'
import { dirname, join } from 'path'
import dayjs from 'dayjs'
import { DataPrivate, DataPublic } from './typing'

/**
 * 获取聊天记录
 * @param time
 * @returns
 */
export const getChats = (time: number): DataPublic[] => {
  const name = `${dayjs(time).format('YYYY-MM-DD')}.json`
  const filePath = join(channelPath, name)
  // 检查文件是否存在，不存在则创建
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify([])) // 存储为数组
    return []
  }
  // 读取文件
  try {
    const data = fs.readFileSync(filePath, 'utf-8')
    const jsonData = JSON.parse(data)
    return jsonData || [] // 直接返回数组
  } catch (error) {
    console.error('Error reading chats:', error)
    return []
  }
}

/**
 * 添加聊天记录
 * @param time
 * @param record
 */
export const addChat = (time: number, record: DataPublic): void => {
  const name = `${dayjs(time).format('YYYY-MM-DD')}.json`
  const filePath = join(channelPath, name)
  // 读取当前聊天记录
  const currentChats = getChats(time)
  currentChats.push(record)
  // 写入更新后的聊天记录
  try {
    fs.writeFileSync(filePath, JSON.stringify(currentChats, null, 2)) // 存储为数组
  } catch (error) {
    console.error('Error saving chat:', error)
  }
}

/**
 * 删除聊天记录
 * @param time
 * @param messageId
 */
export const delChat = (time: number, messageId: number): void => {
  const name = `${dayjs(time).format('YYYY-MM-DD')}.json`
  const filePath = join(channelPath, name)
  // 读取当前聊天记录
  const currentChats = getChats(time)
  const updatedChats = currentChats.filter(chat => chat.d.MessageId !== messageId)
  // 写入更新后的聊天记录
  try {
    fs.writeFileSync(filePath, JSON.stringify(updatedChats, null, 2)) // 存储为数组
  } catch (error) {
    console.error('Error saving chat:', error)
  }
}

/**
 * 获取私聊记录
 * @param time
 * @returns
 */
export const getPrivateChats = (time: number): DataPrivate[] => {
  const name = `${dayjs(time).format('YYYY-MM-DD')}.json`
  const filePath = join(privatePath, name)
  // 检查文件是否存在，不存在则创建
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify([])) // 存储为数组
    return []
  }
  // 读取文件
  try {
    const data = fs.readFileSync(filePath, 'utf-8')
    const jsonData = JSON.parse(data)
    return jsonData || [] // 直接返回数组
  } catch (error) {
    console.error('Error reading chats:', error)
    return []
  }
}

/**
 * 添加私聊记录
 * @param time
 * @param record
 */
export const addPrivateChat = (time: number, record: DataPrivate): void => {
  const name = `${dayjs(time).format('YYYY-MM-DD')}.json`
  const filePath = join(privatePath, name)
  // 读取当前聊天记录
  const currentChats = getPrivateChats(time)
  currentChats.push(record)
  // 写入更新后的聊天记录
  try {
    fs.writeFileSync(filePath, JSON.stringify(currentChats, null, 2)) // 存储为数组
  } catch (error) {
    console.error('Error saving chat:', error)
  }
}

/**
 * 删除私聊记录
 * @param time
 * @param messageId
 */
export const delPrivateChat = (time: number, messageId: number): void => {
  const name = `${dayjs(time).format('YYYY-MM-DD')}.json`
  const filePath = join(privatePath, name)
  // 读取当前聊天记录
  const currentChats = getPrivateChats(time)
  const updatedChats = currentChats.filter(chat => chat.d.MessageId !== messageId)
  // 写入更新后的聊天记录
  try {
    fs.writeFileSync(filePath, JSON.stringify(updatedChats, null, 2)) // 存储为数组
  } catch (error) {
    console.error('Error saving chat:', error)
  }
}
