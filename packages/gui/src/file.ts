import { mkdirSync } from 'fs'
import { join } from 'path'

// 配置文件目录
const guiPath = join(process.cwd(), 'gui')
// 缓存目录
const cachePath = join(guiPath, '.cache')

// 频道缓存目录
const channelPath = join(cachePath, 'channel')
// 私聊缓存目录
const privatePath = join(cachePath, 'private')
mkdirSync(channelPath, { recursive: true })
mkdirSync(privatePath, { recursive: true })

// 文件缓存目录
// const filePath = join(cachePath, 'file')
// mkdirSync(filePath, { recursive: true })

export { guiPath, channelPath, privatePath }
