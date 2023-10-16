import { compilationTools } from 'alemon-rollup'
;(async function run() {
  const ars = process.argv.slice(2)
  const Options = {
    input: 'apps/**/*.ts',
    output: 'alemon.app.js'
  }
  const i = ars.indexOf('--i')
  if (i != -1) {
    Options.input = ars[i + 1]
  }
  const o = ars.indexOf('--o')
  if (ars.indexOf('--o') != -1) {
    Options.output = ars[o + 1]
  }
  await compilationTools({
    aInput: Options.input,
    aOutput: Options.output
  })
})()
