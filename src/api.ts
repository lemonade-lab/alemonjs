import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import FormData from "form-data";
import axios from "axios";

// 非依赖引用
import { BotConfigType } from "./types.js";

/** 环境配置 */
const Acf = {
  sandbox_api: "https://sandbox.api.sgroup.qq.com",
  api: "https://api.sgroup.qq.com",
};

let cfg: BotConfigType;

/**
 * 得到环境api
 * @returns
 */
function getUrl(): string {
  //沙箱环境
  if (cfg.sandbox) return Acf.sandbox_api;
  //正式环境
  return Acf.api;
}

/**
 * 创建api配置
 * @param val
 * @returns
 */
export function createApi(val: BotConfigType): void {
  cfg = val;
  return;
}

/**
 * 发送本地路径的图片
 * @param id 私信传频道id,公信传子频道id
 * @param message {消息编号,图片,内容}
 * @param isGroup 是否是群聊
 * @returns
 */
export async function sendImage(
  id: string,
  message: {
    msg_id: string;
    file_image: string | Buffer | URL;
    content?: string;
  },
  isGroup: boolean
): Promise<any> {
  const urlbase = getUrl();

  /** 读取本地图片地址 */
  let picData = createReadStream(message.file_image);

  /* 请求数据包 */
  let formdata = new FormData();
  formdata.append("msg_id", message.msg_id);
  if (typeof message.content === "string")
    formdata.append("content", message.content);
  formdata.append("file_image", picData);

  let url = ``;
  if (!isGroup) {
    url = `${urlbase}/dms/${id}/messages`;
  } else {
    url = `${urlbase}/channels/${id}/messages`;
  }

  /* 采用请求方式发送数据 */
  return await axios({
    method: "post",
    url,
    headers: {
      "Content-Type": formdata.getHeaders()["content-type"],
      Authorization: `Bot ${cfg.appID}.${cfg.token}`,
    },
    data: formdata,
  }).catch((err) => err);
}

/**
 * 发送buffer图片
 * @param id 私信传频道id,公信传子频道id
 * @param message {消息编号,图片,内容}
 * @param isGroup 是否是群聊
 * @returns
 */
export async function postImage(
  id: string,
  message: {
    msg_id: string;
    file_image: string | Buffer | URL;
    content?: string;
  },
  isGroup: boolean
): Promise<any> {
  // 得到环境
  const urlbase = getUrl();
  /* 创建可读流对象 */
  const picData = new Readable();
  picData.push(message.file_image);
  picData.push(null);

  /* 构建请求数据包 */
  const formdata = new FormData();
  formdata.append("msg_id", message.msg_id);
  if (typeof message.content === "string")
    formdata.append("content", message.content);
  formdata.append("file_image", picData, {
    filename: "image.jpg", // 为上传的图片指定文件名，可以根据实际情况修改
    contentType: "image/jpeg", // 指定上传的图片类型，可以根据实际情况修改
  });

  let url: string = "";
  if (!isGroup) {
    url = `${urlbase}/dms/${id}/messages`;
  } else {
    url = `${urlbase}/channels/${id}/messages`;
  }

  /* 采用请求方式发送数据 */
  return await axios({
    method: "post",
    url,
    headers: {
      "Content-Type": `multipart/form-data; boundary=${formdata.getBoundary()}`,
      Authorization: `Bot ${cfg.appID}.${cfg.token}`,
    },
    data: formdata,
  }).catch((err) => err);
}
