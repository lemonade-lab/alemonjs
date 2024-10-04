import path from 'path'

/**
 * Rollup 插件，用于处理图片文件并生成相对路径
 * @param {Object} options
 * @returns {Object}
 */
const rollupNodeFiles = ({ filter }) => {
  return {
    name: 'rollup-node-files',
    async load(id) {
      const { dir, name, ext } = path.parse(id)
      // 处理模块文件（ext 为空）
      if (ext === '') {
        return {
          code: `export default ${JSON.stringify(id)}`,
          format: 'module'
        }
      }
      // 过滤掉不匹配的文件
      if (!filter.test(ext)) return null
      // 获取输出目录
      const outputDir = path.resolve(process.cwd(), 'lib') // 这里可以根据需要调整输出目录
      // 计算相对路径
      const relativePath = path.relative(outputDir, id)
      // 生成内容
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
        code: contents,
        format: 'module'
      }
    }
  }
}

export { rollupNodeFiles }
