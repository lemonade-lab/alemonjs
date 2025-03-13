#!/usr/bin/env node
import { join } from 'path'
import fs from 'fs'
import YAML from 'yaml'
const configPath = join(process.cwd(), 'alemon.config.yaml')

/**
 * 更新配置
 * @param {*} action  add, remove, set, del, get
 * @param {*} key  配置键
 * @param {*} value  配置值
 * @returns
 */
export function updateConfig(action, key, value = []) {
  let config = {}
  if (fs.existsSync(configPath)) {
    const data = fs.readFileSync(configPath, 'utf8')
    config = YAML.parse(data) ?? {}
  }
  const keys = key.split('.')
  let current = config
  if (action === 'add') {
    for (let i = 0; i < keys.length - 1; i++) {
      const currentKey = keys[i]
      if (current[currentKey] === null || typeof current[currentKey] !== 'object') {
        current[currentKey] = {} // 确保当前键的值是一个对象
      }
      current = current[currentKey]
    }
    const finalKey = keys[keys.length - 1]
    if (!Array.isArray(current[finalKey])) {
      current[finalKey] = [] // 如果最终键的值不是数组，则初始化为空数组
    }
    current[finalKey] = [...new Set([...current[finalKey], ...value])] // 去重并添加新值
  } else if (action === 'remove') {
    for (let i = 0; i < keys.length - 1; i++) {
      const currentKey = keys[i]
      if (current[currentKey] === null || typeof current[currentKey] !== 'object') {
        return // 如果路径不存在，直接返回
      }
      current = current[currentKey]
    }
    const finalKey = keys[keys.length - 1]
    if (Array.isArray(current[finalKey])) {
      current[finalKey] = current[finalKey].filter(item => !value.includes(item)) // 过滤掉要删除的值
    }
  } else if (action === 'set') {
    for (let i = 0; i < keys.length - 1; i++) {
      const currentKey = keys[i]
      if (current[currentKey] === null || typeof current[currentKey] !== 'object') {
        current[currentKey] = {} // 确保当前键的值是一个对象
      }
      current = current[currentKey]
    }
    current[keys[keys.length - 1]] = value[0]
  } else if (action === 'del') {
    for (let i = 0; i < keys.length - 1; i++) {
      const currentKey = keys[i]
      if (current[currentKey] === null || typeof current[currentKey] !== 'object') {
        return // 如果路径不存在，直接返回
      }
      current = current[currentKey]
    }
    delete current[keys[keys.length - 1]]
  } else if (action === 'get') {
    for (let i = 0; i < keys.length; i++) {
      const currentKey = keys[i]
      if (current[currentKey] === null || typeof current[currentKey] !== 'object') {
        if (i === keys.length - 1) {
          console.log(current[currentKey]) // 输出最终值
        } else {
          console.log(undefined) // 路径不存在
        }
        return
      }
      current = current[currentKey]
    }
    console.log(current) // 输出最终值
    return
  }

  fs.writeFileSync(configPath, YAML.stringify(config))
}
