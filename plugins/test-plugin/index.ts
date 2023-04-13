import { red } from 'kolorist'
import { AppName } from './app.config'
import { travel } from './app.file'
const apps = {}
const place = `plugins/${AppName}`
const filepath = `./${place}/apps`
const arr: string[] = []
travel(filepath, (item: any) => {
  if (item.search('.ts') != -1) {
    arr.push(item)
  }
  if (item.search('.js') != -1) {
    arr.push(item)
  }
})
arr.forEach(async (item: any) => {
  const AppDir = `.${item.replace(/\\/g, '/').replace(place, '')}`
  const classObject = await import(AppDir)
  for (const item in classObject) {
    if (classObject[item].prototype) {
      if (apps.hasOwnProperty(item)) {
        console.log(red(`[同名class export]  ${AppDir}`))
      }
      apps[item] = classObject[item]
    } else {
      console.log(red(`[非class export]  ${AppDir}`))
    }
  }
})
export { apps }
