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
  if (typeof next == 'string') {
    // 如果是参数
    if (next.startsWith('-')) return null
    // 如果是值
    return next
  }
  return null
}

const getRexs = () => {
  const i = getArgvValue('--esms-image-import')
  const i_rex = i ? new RegExp(i) : /(\.png|\.jpg|\.jpeg|\.gif|\.svg|.webp)$/
  const s = getArgvValue('--esms-css-import')
  const s_rex2 = s ? new RegExp(s) : /(\.css)$/
  const v = getArgvValue('--esms-vidoe-import')
  const v_rex3 = v ? new RegExp(v) : /(\.mp4|\.webm|\.ogv)$/
  const v2 = getArgvValue('--esms-aodio-import')
  const v_rex4 = v2 ? new RegExp(v2) : /(\.mp3|\.wav|\.ogg)$/
  return [i_rex, s_rex2, v_rex3, v_rex4]
}

/**
 * 处理非js文件的加载
 * @param {*} url
 * @param {*} context
 * @param {*} defaultLoad
 * @returns
 */
export async function load(url, context, defaultLoad) {
  // 禁用loader
  if (argv.includes('--esms-no-import')) {
    return defaultLoad(url, context)
  }
  const getImport = () => {
    // 获取输出目录
    const outputDir = path.dirname(context.parentURL || 'index.js')
    // 计算相对路径
    const relativePath = path.relative(outputDir, url)
    // 生成模块内容
    const contents = `
        const createUrl = (basePath, path) => {
          const platform = ['linux', 'android', 'darwin'];
          const T = platform.includes(process.platform);
          const reg = T ? /^file:\\/\\// : /^file:\\/\\/\\//;
          return new URL(path, basePath).href.replace(reg, '');
        };
        export default createUrl(import.meta.url, '${relativePath}');
      `
    return {
      format: 'module',
      source: contents,
      // 防止进一步处理
      shortCircuit: true
    }
  }
  const rexs = getRexs()
  for(const rex of rexs) {
    if (rex.test(url)) {
      return getImport()
    }
  }
  return defaultLoad(url, context)
}
