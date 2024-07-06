import { createRequire } from 'module'
import { resolve } from 'path'
const require = createRequire(import.meta.url)
/**
 * 常用扩展名
 */
const CustomExtensions = [
  '.css',
  //
  '.apng',
  '.png',
  '.jpg',
  '.jpeg',
  '.jfif',
  '.pjpeg',
  '.pjp',
  '.gif',
  '.svg',
  '.ico',
  '.webp',
  '.avif',
  //
  '.mp4',
  '.webm',
  '.ogg',
  '.mp3',
  '.wav',
  '.flac',
  '.aac',
  '.opus',
  '.mov',
  '.m4a',
  '.vtt',
  '.woff',
  '.woff2',
  '.eot',
  '.ttf',
  '.otf',
  //
  '.md'
]
/**
 * 扩展引入
 */
for (const ext of CustomExtensions) {
  require.extensions[ext] = (module, filename) => {
    module.exports = resolve(filename)
  }
}
