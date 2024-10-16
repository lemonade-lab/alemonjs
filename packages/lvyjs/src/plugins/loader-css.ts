import { createFilter } from '@rollup/pluginutils'
import { basename, dirname, resolve } from 'node:path'
import { type InputPluginOption } from 'rollup'
/**
 *
 * @returns
 */
export const runRollupStylesCSSImport = () => {
  const { include = /\.(css|scss)$/i } = {}
  const filter = createFilter(include, null)
  return {
    name: 'c-css',
    resolveId(source, importer) {
      if (filter(source)) {
        return resolve(dirname(importer), source)
      }
    },
    load(id) {
      if (filter(id)) this.addWatchFile(resolve(id))
      return null
    },
    async transform(code, id) {
      if (!filter(id)) return null
      // 删除 export default css
      const codex = code.replace(/(export|default css)/g, '')
      // 使用 eval 执行代码并获取默认导出的值
      const evalCode = `
    (() => {
        ${codex}  
        return css;  
    })()
`
      // 得到css变量的值
      const csscode = eval(evalCode)
      // 确保最后生产的css文件
      const refeId = this.emitFile({
        // 属于静态资源
        type: 'asset',
        name: basename(`${id}.css`),
        // 内容
        source: csscode
      })
      const contents = `
      const createUrl = () => {
        const platform = ['linux', 'android', 'darwin'];
        const T = platform.includes(process.platform);
        const reg = T ?  /^file:\\/\\// : /^file:\\/\\/\\//
        return import.meta.ROLLUP_FILE_URL_${refeId}.replace(reg, '') 
      };
      export default createUrl();
    `
      return contents
    }
  } as InputPluginOption
}
