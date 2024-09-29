#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { cpSync, rmSync } from 'fs'
import { execSync } from 'child_process'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'node:url'
const args = [...process.argv.slice(2)]

interface options {
  name: string
  force: boolean
  cancel: boolean
}

const currentFilePath = fileURLToPath(import.meta.url)
const currentDirPath = dirname(currentFilePath)
const alemonjsCliPath = resolve(currentDirPath)

const NpmPublish = `
# 忽略所有文件
/*   
# 不忽略next
!/assets
!/lib
!/public
`

const NpmrcBody = `# 为项目单独设置镜像
registry=https://registry.npmmirror.com
# canvas
canvas_binary_host_mirror=https://ghproxy.com/https://github.com/Automattic/node-canvas/releases/download/
# node-sass
sass_binary_site=https://npmmirror.com/mirrors/node-sass/
# sqlite3
node_sqlite3_binary_host_mirror=https://npmmirror.com/mirrors/sqlite3
# TFJS
TFJS_NODE_CDN_STORAGE=https://cdn.npmmirror.com/binaries/
# pup
PUPPETER_DOWNLOAD_BASE_URL=https://npmmirror.com/mirrors/chrome-for-testing
# 不生成lock
package-lock=false
# 改为 npm 依赖安装方式
node-linker=hoisted
# 可耻的提升
shamefully-hoist=true
# 严格的对等依赖关系
strict-peer-dependencies=false`

const GitBody = `
node_modules
/config
/data
/logs
/resources
/renderers
/plugins
/index.js
/types
/public
/temp
/lib
yarn.lock
`

async function createAlemonjs({ name, force, cancel }: options) {
  // 名字不存在
  if (!name) process.exit()
  // 当前目录下
  const dirPath = `./${name}`
  // 存在
  if (existsSync(dirPath)) {
    // 没有强制覆盖
    if (!force) {
      console.error('Robot name already exists!')
      return
    }
    rmSync(dirPath, { recursive: true })
  }
  mkdirSync(dirPath, { recursive: true })
  // 换行
  console.info('\n')
  try {
    //  templatePath  --> dirPath
    const templatePath = join(alemonjsCliPath, 'template')
    console.info('Copying template...')
    cpSync(templatePath, dirPath, { recursive: true })

    writeFileSync(join(dirPath, '.npmrc'), NpmrcBody)
    writeFileSync(join(dirPath, '.gitignore'), GitBody)
    writeFileSync(join(dirPath, '.npmignore'), NpmPublish)

    // 切换目录
    process.chdir(dirPath)

    // 自动加载依赖
    if (!cancel) {
      // 加载基础
      console.info(`npm install`)
      execSync('npm install', { stdio: 'inherit' })
    }

    // execSync('git init', { stdio: 'inherit' })

    console.info(`------------------------------------`)
    console.info(`cd ${name}       #进入机器人目录`)

    // 提示加载依赖
    if (cancel) {
      console.info(`------------------------------------`)
      console.info(`rm -rf .npmrc  #国际环境需删除.npmc`)
      console.info(`npm install`)
    }

    console.info(`------------------------------------`)
    console.info(`npm run dev`)
  } catch (error) {
    console.info(`${name} ${error}`)
    return
  }
}
const data: options = {
  name: 'alemonb',
  force: false,
  cancel: false
}
const inputName = args.indexOf('@name')
if (inputName != -1) {
  const output = args[inputName + 1].replace(/[^\u4e00-\u9fa5a-zA-Z0-9_]/g, '')
  if (output.length >= 3) data.name = output
}
// 强制覆盖
if (args.includes('force') || args.includes('f')) {
  data.force = true
}
// 取消依赖加载
if (args.includes('cancel') || args.includes('c')) {
  data.cancel = true
}
createAlemonjs(data)
