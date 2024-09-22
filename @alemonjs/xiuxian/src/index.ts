import { getLoadFiles } from 'alemonjs'
const text = getLoadFiles(import.meta.url)
console.log(text)
export default config => {
  console.log(config)
  // 返回应用路径。
  return {
    apps: getLoadFiles(import.meta.url)
  }
}
