import { createRequire } from 'module'
import { join } from 'path'
const require = createRequire(import.meta.url)
export const MainCSS = require('./main.css')
export const OutputCss = join(process.cwd(), 'public', 'output.css')
