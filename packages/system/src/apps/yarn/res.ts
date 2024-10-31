import { join } from 'path'
import { readFileSync } from 'fs'
import { Text, useSend } from 'alemonjs'
export default OnResponse(
  async event => {
    const Send = useSend(event)
    if (event.IsMaster) {
      Send(Text('你不是主人'))
      return
    }
    const dir = join(process.cwd(), 'package.json')
    const pkg = JSON.parse(readFileSync(dir, 'utf-8'))
    let arr = []
    if (pkg?.dependencies) {
      const dependenciesArray = Object.keys(pkg.dependencies)
      if (dependenciesArray.length >= 0) {
        const arr2 = dependenciesArray.map(key => `${key}:"${pkg.dependencies[key]}"`)
        arr = [...arr, '[dependencies]', ...arr2]
      }
    }
    if (pkg?.devDependencies) {
      const devDependenciesArray = Object.keys(pkg.devDependencies)
      if (devDependenciesArray.length >= 0) {
        const arr2 = devDependenciesArray.map(key => `${key}:"${pkg.devDependencies[key]}"`)
        arr = [...arr, '[devDependencies]', ...arr2]
      }
    }
    //
    if (arr.length <= 0) {
      Send(Text('依赖为空'))
    } else {
      Send(Text(arr.join('\n')))
    }
  },
  'message.create',
  /^(#|\/)?依赖配置$/
)
