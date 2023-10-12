import { spawn } from 'child_process'
export function nodeScripts(name = 'node', file = '', ars = []) {
  const command = spawn(`${name} ${file} ${ars.join(' ')}`, { shell: true })
  command.stdout.on('data', data => {
    process.stdout.write(data.toString())
  })
  command.stderr.on('data', data => {
    process.stderr.write(data.toString())
  })
}
