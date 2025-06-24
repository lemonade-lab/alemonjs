// NODE_OPTIONS='--import tsx' npx rollup --config rollup.config.js
import { spawnSync } from 'child_process'
const args = [...process.argv.slice(2)]
const msg = spawnSync('npx', ['rollup', '--config', 'rollup.config.js', ...args], {
  stdio: 'inherit',
  env: Object.assign({}, process.env, {
    NODE_OPTIONS: '--import tsx'
  }),
  shell: process.platform === 'win32'
})
if (msg.error) {
  console.error(msg.error)
  process.exit()
}
