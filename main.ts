import { createApps } from './src/index.js'
import * as test from './apps.js'
const apps = createApps(import.meta.url)
apps.component(test)
apps.mount()
console.info('[APP] 本地测试 DEV')
