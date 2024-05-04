import typescript from '@rollup/plugin-typescript'
import dts from 'rollup-plugin-dts'
import terser from '@rollup/plugin-terser'
export default [
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
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'min.js',
      format: 'es',
      sourcemap: false
    },
    plugins: [
      typescript({
        rootDir: './src',
        target: 'ESNext',
        module: 'NodeNext',
        moduleResolution: 'Node16',
        ignoreDeprecations: '5.0',
        esModuleInterop: true,
        preserveConstEnums: true,
        typeRoots: ['node_modules/@types'],
        declaration: false // 生成类型声明文件
      }),
      // multiEntry()
      // 压缩
      terser()
    ],
    onwarn: (warning, warn) => {
      // 忽略与无法解析the导入相关the警告信息
      if (warning.code === 'UNRESOLVED_IMPORT') return
      // 继续使用默认the警告处理
      warn(warning)
    }
  },
  {
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
  },
  {
    input: 'src/run.ts',
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
  },
  {
    input: 'bin/index.ts',
    output: {
      file: 'bin/index.js',
      format: 'es',
      sourcemap: false
    },
    plugins: [
      typescript({
        declaration: false
      })
    ],
    onwarn: (warning, warn) => {
      // 忽略与无法解析the导入相关the警告信息
      if (warning.code === 'UNRESOLVED_IMPORT') return
      // 继续使用默认the警告处理
      warn(warning)
    }
  }
]
