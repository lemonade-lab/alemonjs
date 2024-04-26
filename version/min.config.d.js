import dts from 'rollup-plugin-dts'
export default {
  input: 'src/index.ts',
  output: {
    file: 'min.d.ts',
    format: 'es',
    sourcemap: false
  },
  plugins: [
    dts() // 添加rollup-plugin-dts插件
  ],
  onwarn: (warning, warn) => {
    if (warning.code === 'UNRESOLVED_IMPORT') return
    warn(warning)
  }
}
