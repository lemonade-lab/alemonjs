# 截图图片压缩问题

```ts
import { createCanvas, loadImage } from 'canvas'
/**
 * 压缩buffer图片
 * @param img
 * @param quality
 * @returns
 */
export async function compressImage(
  img: Buffer,
  quality: number
): Promise<Buffer> {
  const image = await loadImage(img)
  const canvas = createCanvas(image.width, image.height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(image, 0, 0)
  ctx.canvas.toDataURL('image/jpeg', quality)
  return new Promise<Buffer>((resolve, reject) => {
    canvas.toBuffer((err: any, buf: Buffer) => {
      if (err) {
        reject(err)
      } else {
        resolve(buf)
      }
    }, 'image/jpeg')
  })
}
```
