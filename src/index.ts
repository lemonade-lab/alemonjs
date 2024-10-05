import { defineChildren } from 'alemonjs'
import css from '@src/input.css'
import png from '@src/xxx.png'
console.log('png', png)
console.log('css', css)
export default defineChildren(config => {
  console.log('本地开发测试启动', config)
  return {
    onCreated() {
      console.log('onCreated')
    }
  }
})
