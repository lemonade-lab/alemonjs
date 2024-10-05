import fs from 'fs'
import path from 'path'

// 尝试从参数中，得到更高优先级的配置
const argv = [...process.argv].slice(2)

/**
 * @param key 参数
 * @returns 参数值
 */
const getArgvValue = key => {
  const v = argv.indexOf(key)
  if (v === -1) return null
  const next = argv[v + 1]
  if (typeof next === 'string' && !next.startsWith('-')) {
    return next
  }
  return null
}

const getRexs = () => {
  const i = getArgvValue('--esms-image-import')
  const i_rex = i ? new RegExp(i) : /(\.png|\.jpg|\.jpeg|\.gif|\.svg|.webp|.ico)$/
  const s = getArgvValue('--esms-css-import')
  const s_rex2 = s ? new RegExp(s) : /(\.css|\.scss)$/
  const v = getArgvValue('--esms-vidoe-import')
  const v_rex3 = v ? new RegExp(v) : /(\.mp4|\.webm|\.ogv)$/
  const v2 = getArgvValue('--esms-aodio-import')
  const v_rex4 = v2 ? new RegExp(v2) : /(\.mp3|\.wav|\.ogg)$/
  const f = getArgvValue('--esms-font-import')
  const f_rex5 = f ? new RegExp(f) : /(\.woff|\.woff2|\.eot|\.ttf|\.otf)$/
  const fi = getArgvValue('--esms-files-import')
  const fi_rex6 = fi ? new RegExp(fi) : /(\.md)$/
  return [i_rex, s_rex2, v_rex3, v_rex4, f_rex5, fi_rex6]
}

let tsconfig: any = null
let aliases = {}

// 初始化函数，读取并解析 tsconfig.json 文件
const init = () => {
  try {
    const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json')
    if (fs.existsSync(tsconfigPath)) {
      const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf-8')
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
 * 生成模块内容
 * @param {string} relativePath 相对路径
 * @returns {string} 模块内容
 */
const generateModuleContent = relativePath => `
  const createUrl = (basePath, path) => {
    const platform = ['linux', 'android', 'darwin'];
    const T = platform.includes(process.platform);
    const reg = T ? /^file:\\/\\// : /^file:\\/\\/\\//;
    return new URL(path, basePath).href.replace(reg, '');
  };
  export default createUrl(import.meta.url, '${relativePath}');
`

/**
 * 处理非js文件的加载
 * @param {string} url URL
 * @param {object} context 上下文
 * @returns {object|null} 加载结果
 */
const handleNonJsFiles = (url, context, defaultLoad) => {
  if (argv.includes('--esms-no-import')) {
    return defaultLoad(url, context)
  }
  const rexs = getRexs()
  for (const rex of rexs) {
    if (rex.test(url)) {
      const outputDir = path.dirname(context.parentURL || 'index.js')
      const relativePath = path.relative(outputDir, url)
      return {
        format: 'module',
        source: generateModuleContent(relativePath),
        shortCircuit: true
      }
    }
  }
  return defaultLoad(url, context)
}

/**
 * 处理路径别名的加载
 * @param {string} url URL
 * @returns {object|null} 加载结果
 */
const handlePathAliases = url => {
  for (const alias in aliases) {
    const aliasPattern = alias.replace('/*', '')
    if (url.startsWith(aliasPattern)) {
      const aliasPaths = aliases[alias]
      for (const aliasPath of aliasPaths) {
        const resolvedPath = path.resolve(
          process.cwd(),
          aliasPath.replace('/*', ''),
          url.replace(aliasPattern, '')
        )
        const fileUrl = new URL(resolvedPath, import.meta.url).href
        return {
          format: 'module',
          source: `
            const module = await import(${fileUrl});
            export default module;
            export * from ${fileUrl};
          `,
          shortCircuit: true
        }
      }
    }
  }
  return null
}

/**
 * 主加载函数
 * @param {string} url URL
 * @param {object} context 上下文
 * @param {function} defaultLoad 默认加载函数
 * @returns {object} 加载结果
 */
export async function load(url, context, defaultLoad) {
  // 禁用路径别名处理或 tsconfig.json 文件读取错误
  if (argv.includes('--esms-no-path') || tsconfig === 'error') {
    // 尝试调用非别名文件加载处理 ，否则调用默认加载函数
    return handleNonJsFiles(url, context, defaultLoad)
  }

  // 处理路径别名的加载
  const aliasResult = handlePathAliases(url)
  if (aliasResult) {
    return aliasResult
  }

  // 处理非js文件的加载
  return handleNonJsFiles(url, context, defaultLoad)
}
