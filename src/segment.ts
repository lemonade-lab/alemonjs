import { readFileSync } from "node:fs";
import http from "http";
import https from "https";

/**
 * 异步请求图片
 * @param url
 * @returns
 */
export function url(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    protocol
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to fetch image: ${response.statusCode}`));
        } else {
          const chunks: Buffer[] = [];
          response.on("data", (chunk) => chunks.push(chunk));
          response.on("end", () => resolve(Buffer.concat(chunks)));
        }
      })
      .on("error", reject);
  });
}

/**
 * 读取绝对路径并返回为buffer
 * @param path
 * @returns
 */
export function buffer(path: string) {
  // 读取本地图片
  const image = readFileSync(path);
  // 将图片转换为 Buffer 对象
  const BufferImage = Buffer.from(image);
  return BufferImage;
}
