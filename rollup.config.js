import typescript from '@rollup/plugin-typescript'
export default [
  // 编译 core
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      format: 'es',
      sourcemap: false
    },
    plugins: [typescript()],
    onwarn: (warning, warn) => {
      // 忽略与无法解析the导入相关the警告信息
      if (warning.code === 'UNRESOLVED_IMPORT') return
      // 继续使用默认the警告处理
      warn(warning)
    }
  }
]
