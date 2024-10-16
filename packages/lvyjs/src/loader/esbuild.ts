import { dirname, join, relative, resolve } from 'path'
import { existsSync, readFileSync } from 'fs'
import { spawn } from 'child_process'
import esbuild, { type Plugin } from 'esbuild'
import crypto from 'node:crypto'

let tsconfig = null
let aliases = {}
const assetsReg = /\.(png|jpg|jpeg|gif|svg|webp|ico)$/
const cssReg = /\.(css|scss)$/

// 初始化函数，读取并解析 tsconfig.json 文件
const init = () => {
  try {
    const tsconfigPath = resolve(process.cwd(), 'tsconfig.json')
    if (existsSync(tsconfigPath)) {
      const tsconfigContent = readFileSync(tsconfigPath, 'utf-8')
      tsconfig = JSON.parse(tsconfigContent)
      aliases = tsconfig.compilerOptions?.paths || {}
    } else {
      tsconfig = 'error'
    }
  } catch {
    tsconfig = 'error'
  }
}

// 初始化配置
init()

/**
 *
 * @param input
 * @param output
 */
const startCssPost = (input: string, output: string) => {
  const run = ['postcss', input, '-o', output, '--watch']
  // 启动 Tailwind 进程
  const cssPostProcess = spawn('npx', run, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })
  cssPostProcess.on('error', err => {
    console.error('Failed to start Tailwind process:', err)
  })
}

/**
 * 生成模块内容
 * @param {string} relativePath 相对路径
 */
const generateModuleContent = (relativePath: string) => {
  const contents = [
    'const createUrl = (basePath, path) => {',
    "const platform = ['linux', 'android', 'darwin'];",
    'const T = platform.includes(process.platform);',
    'const reg = T ? /^file:\\/\\// : /^file:\\/\\/\\//;',
    "return new URL(path, basePath).href.replace(reg, '');",
    '};',
    `const fileUrl = createUrl(import.meta.url, '${relativePath}');`,
    'export default fileUrl;'
  ].join('\n')
  return contents
}

const chache = {}

const getHash = (str: string) => {
  // 使用 MD5 算法创建哈希对象
  const hash = crypto.createHash('md5')
  // 更新哈希对象内容
  hash.update(str)
  return hash.digest('hex')
}

/**
 *
 * @param inputPath
 * @returns
 */
const convertPath = (inputPath: string) => {
  return process.platform === 'win32' ? inputPath.replace(/\\/g, '/') : inputPath
}

const handleAsstesFile = (url: string) => {
  for (const alias in aliases) {
    const aliasPattern = alias.replace('/*', '')
    if (url.startsWith(aliasPattern)) {
      const aliasPaths = aliases[alias]
      for (const aliasPath of aliasPaths) {
        const fileUrl = join(
          process.cwd(),
          aliasPath.replace('/*', ''),
          url.replace(aliasPattern, '')
        )
        return `export default "${convertPath(fileUrl)}";`
      }
    }
  }
  return null
}

/**
 *
 * @param param0
 */
export const esBuildAsstesFule = (): Plugin => {
  const index = process.argv.indexOf('--import-assets')
  const filter = index != -1 ? new RegExp(process.argv[index + 1]) : assetsReg
  const namespace = 'assets'
  return {
    name: 'file-loader',
    setup(build) {
      const outputDirs = new Map()
      // 过滤图片文件
      build.onResolve({ filter }, args => {
        const dir = resolve(args.resolveDir, args.path)
        outputDirs.set(dir, args.importer)
        return {
          path: dir,
          namespace
        }
      })
      build.onLoad({ filter, namespace }, async args => {
        if (!outputDirs.has(args.path)) return null
        const outputDir = outputDirs.get(args.path)
        const relativePath = relative(dirname(outputDir), args.path)
        // 不管是别名资源。都只是需要返回一个路径
        const aliasResult = handleAsstesFile(relativePath)
        if (aliasResult) {
          return {
            contents: aliasResult,
            loader: 'js'
          }
        }
        return {
          contents: generateModuleContent(relativePath),
          loader: 'js'
        }
      })
    }
  }
}

/**
 *
 * @param fileUrl
 * @returns
 */
const handleCSS = (fileUrl: string) => {
  const hash = getHash(fileUrl)
  const outputDir = join(process.cwd(), 'node_modules', 'alemonjs', 'assets', `${hash}.css`)
  if (!chache[fileUrl]) {
    startCssPost(fileUrl, outputDir)
    chache[fileUrl] = true
  }
  return outputDir
}

/**
 * 处理路径别名的加载
 * @param {string} url URL
 * @returns {object|null} 加载结果
 */
const handleCSSPath = (url: string) => {
  for (const alias in aliases) {
    const aliasPattern = alias.replace('/*', '')
    if (url.startsWith(aliasPattern)) {
      const aliasPaths = aliases[alias]
      for (const aliasPath of aliasPaths) {
        const fileUrl = join(
          process.cwd(),
          aliasPath.replace('/*', ''),
          url.replace(aliasPattern, '')
        )
        const outputDir = handleCSS(fileUrl)
        return `export default "${convertPath(outputDir)}";`
      }
    }
  }
  return null
}

/**
 * css资源处理插件
 * @param param0
 * @returns
 */
export const esBuildCSS = (): Plugin => {
  const index = process.argv.indexOf('--import-css')
  const filter = index != -1 ? new RegExp(process.argv[index + 1]) : cssReg
  const namespace = 'css'
  return {
    name: 'css-loader',
    setup(build) {
      const outputDirs = new Map()
      // 过滤 CSS/SCSS 文件
      build.onResolve({ filter }, args => {
        const dir = resolve(args.resolveDir, args.path)
        outputDirs.set(dir, args.importer)
        return {
          path: dir,
          namespace
        }
      })
      // 加载 CSS/SCSS 文件
      build.onLoad({ filter, namespace }, async args => {
        if (!outputDirs.has(args.path)) return null
        const outputDir = outputDirs.get(args.path)
        // 计算相对路径
        const relativePath = relative(dirname(outputDir), args.path)
        // 处理路径别名的加载
        const aliasResult = handleCSSPath(relativePath)
        if (aliasResult) {
          return {
            contents: aliasResult,
            loader: 'js'
          }
        }
        // 不是别名资源
        return {
          contents: `export default "${convertPath(handleCSS(args.path))}";`,
          loader: 'js'
        }
      })
    }
  }
}

/**
 *
 * @param input
 * @returns
 */
export const ESBuild = async (input: string) => {
  const plugins = []
  if (!process.arch.includes('--no-import-css')) {
    plugins.push(esBuildCSS())
  }
  if (!process.arch.includes('--no-import-assets')) {
    plugins.push(esBuildAsstesFule())
  }
  const result = await esbuild.build({
    entryPoints: [input],
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
    plugins,
    external: ['*']
  })
  return result.outputFiles.map(file => new TextDecoder().decode(file.contents)).join('\n')
}
