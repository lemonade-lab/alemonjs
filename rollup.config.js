import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import alias from '@rollup/plugin-alias'
import dts from 'rollup-plugin-dts'

const packages = ['alemonjs', 'discord', 'kook', 'qq-group-bot', 'qq-guild-bot']

const config = packages.map(name => {
  return [
    {
      input: `packages/${name}/src/index.ts`,
      output: {
        dir: `packages/${name}/lib`,
        format: 'es',
        sourcemap: false,
        preserveModules: true
      },
      plugins: [
        typescript({
          compilerOptions: {
            outDir: `packages/${name}/lib`
          },
          include: [`packages/${name}/src/**/*`]
        })
      ],
      onwarn: (warning, warn) => {
        if (warning.code === 'UNRESOLVED_IMPORT') return
        warn(warning)
      }
    },
    {
      input: `packages/${name}/src/index.ts`,
      output: {
        // lib 目录
        dir: `packages/${name}/lib`,
        format: 'es',
        sourcemap: false,
        preserveModules: true
      },
      plugins: [
        alias({
          entries: [
            {
              find: '@',
              replacement: resolve(dirname(fileURLToPath(import.meta.url)), 'src')
            }
          ]
        }),
        typescript({
          compilerOptions: {
            outDir: `packages/${name}/lib`
          },
          include: [`packages/${name}/src/**/*`]
        }),
        dts()
      ],
      onwarn: (warning, warn) => {
        if (warning.code === 'UNRESOLVED_IMPORT') return
        warn(warning)
      }
    }
  ]
})

export default defineConfig(config.flat(Infinity))
