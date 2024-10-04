import { dirname, basename, resolve } from 'path'
import { readFileSync } from 'fs'
/**
 * Rollup 插件，用于处理图片文件并生成相对路径
 * @param {Object} options
 * @returns {Object}
 */
const rollupNodeFiles = ({ filter }) => {
  return {
    name: 'rollup-node-files',
    resolveId(source, importer) {
      if (filter.test(source)) {
        return resolve(dirname(importer), source)
      }
    },
    load(id) {
      if (filter.test(id)) {
        const referenceId = this.emitFile({
          type: 'asset',
          name: basename(id),
          source: readFileSync(id)
        })
        const contents = `
                const createUrl = () => {
                  const platform = ['linux', 'android', 'darwin'];
                  const T = platform.includes(process.platform);
                  const reg = T ?  /^file:\\/\\// : /^file:\\/\\/\\//
                  return import.meta.ROLLUP_FILE_URL_${referenceId}.replace(reg, '') 
                };
                export default createUrl();
              `
        return contents
      }
    }
  }
}

export { rollupNodeFiles }
