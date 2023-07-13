import { EmojiMap } from "./emoji.js";
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
/**
 * 回复指定消息
 * @param msg_id
 * @returns
 */
export function reply(msg_id: string) {
  return { message_reference: { message_id: msg_id } };
}
/**
 * 艾特某人
 * @param uid
 * @returns
 */
export function at(uid: string) {
  return `<@!${uid}>`;
}
/**
 * 艾特全体
 * @returns
 */
export function atall() {
  return `<@!everyone>`;
}
/**
 * 字符串表情
 * @param type
 * @param id
 * @returns
 */
export function expression(type: number, id: number) {
  return EmojiMap[type][id];
}
/**
 * 系统表情
 * @param id
 * @returns
 */
export function face(id: number) {
  return `<emoji:${id}>`;
}
/**
 * 子频道引用
 * @param channel_id
 * @returns
 */
export function channel(channel_id: string) {
  return `<#${channel_id}>`;
}
/**
 * 加载url图片
 * @param url
 * @returns
 */
export function image(url: string) {
  return {
    image: url,
  };
}
/**
 * 卡片消息
 * @param title
 * @param prompt
 * @param url
 * @param arr
 * @returns
 */
export function embed(
  title: string,
  prompt: string,
  url: string,
  arr: Array<any>
) {
  let fields = [];
  for (let item of arr) {
    fields.push({
      name: item,
    });
  }
  return {
    embed: {
      title,
      prompt,
      thumbnail: {
        url,
      },
      fields,
    },
  };
}
/**
 * 按钮消息
 * @param arr
 * @returns
 */
export function button(arr: Array<{ desc: string; link?: string }>) {
  const obj = [];
  const obj_kv = [];
  for (let item of arr) {
    obj_kv.push({
      key: "desc",
      value: item.desc,
    });
    if (item.link) {
      obj_kv.push({
        key: "link",
        value: item.link,
      });
    }
  }
  for (let item of obj) {
    obj.push({
      obj_kv: item,
    });
  }
  return {
    ark: {
      template_id: 23,
      kv: [
        {
          key: "#PROMPT#",
          value: "示范",
        },
        {
          key: "#LIST#",
          obj,
        },
      ],
    },
  };
}
