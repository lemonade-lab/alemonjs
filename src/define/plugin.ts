import { existsSync, readdirSync, copyFileSync, mkdirSync } from 'fs'
import { getAppRegex } from '../alemon/index.js'
import { join } from 'path'

/**
 * 遍历复制方法
 */
const copyFiles = (source, destination) => {
  if (!existsSync(destination)) {
    mkdirSync(destination, { recursive: true })
  }
  const files = readdirSync(source)
  for (const file of files) {
    const sourcePath = join(source, file)
    const destinationPath = join(destination, file)
    copyFileSync(sourcePath, destinationPath)
  }
}

/**
 * 同步挂载文件
 * @param dir 插件目录
 */
export function copyAppsFile(dir) {
  if (!existsSync(dir)) return
  const flies = readdirSync(dir)
  if (flies.length === 0) return
  const { RegexOpen, RegexClose } = getAppRegex()
  // 插件名
  const apps = flies
    .filter(item => RegexOpen.test(item))
    .filter(item => {
      // 关闭符合条件的
      if (!RegexClose) {
        return true
      }
      if (RegexClose.test(item)) {
        return false
      }
      return true
    })
  for (const appname of apps) {
    const appPath = join(dir, appname)
    if (existsSync(`${appPath}/assets`)) {
      const originalAddress = `${appPath}/assets`
      const destinationAddress = join(
        process.cwd(),
        `/public/.${appname}/assets`
      )
      copyFiles(originalAddress, destinationAddress)
    }
    if (existsSync(`${appPath}/pages`)) {
      const originalAddress = `${appPath}/pages`
      const destinationAddress = join(
        process.cwd(),
        `/public/.${appname}/pages`
      )
      copyFiles(originalAddress, destinationAddress)
    }
    if (existsSync(`${appPath}/plugins`)) {
      const originalAddress = `${appPath}/plugins`
      const destinationAddress = join(
        process.cwd(),
        `/public/.${appname}/plugins`
      )
      copyFiles(originalAddress, destinationAddress)
    }
    if (existsSync(`${appPath}/server`)) {
      const originalAddress = `${appPath}/server`
      const destinationAddress = join(
        process.cwd(),
        `/public/.${appname}/server`
      )
      copyFiles(originalAddress, destinationAddress)
    }
  }
}
