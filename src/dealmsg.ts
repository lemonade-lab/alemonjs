import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import lodash from "lodash";

// 非依赖引用
import { getApp, delApp, getMessage, getAppKey } from "./message.js";
import { conversationHandlers, getConversationState } from "./dialogue.js";
import { EventEnum, MessageEvent } from "./typings.js";

// 指令类型
export interface CmdType {
  [key: string]: Array<any>;
}

// 指令合集
let Command: CmdType;
// 插件名集合
let ExampleArr = [];
let PluginsArr = [];

/**
 * 应用挂载
 * @param AppsObj
 * @param AppName
 * @param belong
 */
async function synthesis(AppsObj: object, AppName: string) {
  for (const item in AppsObj) {
    const keys = new AppsObj[item]();
    // 归属和指令数组都不在,是错误类
    if (!keys["belong"] || !keys["rule"]) continue;
    // 指令数组
    keys["rule"].forEach((key: any) => {
      // 收集指令
      Command[keys["belong"]].push({
        // 指令
        reg: key["reg"],
        // 优先级
        priority: keys["priority"],
        // 说明
        dsc: keys["dsc"],
        // 归属
        belong: keys["belong"],
        // 类型
        type: keys["type"],
        // 插件名
        AppName,
        // 方法名
        fncName: key["fnc"],
        // 函数
        fnc: keys[key["fnc"]],
      });
    });
  }
  return;
}

/**
 * 加载简单插件
 * @param dir
 */
async function loadExample(dir: string) {
  // 初始化
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  // 读取文件
  const readDir = readdirSync(dir);
  // 正则匹配ts文件并返回
  const flies = readDir.filter((item) => /.(ts|js)$/.test(item));
  for (let appname of flies) {
    if (!existsSync(`${dir}/${appname}`)) {
      continue;
    }
    const AppName = appname.replace(/\.(ts|js)$/, () => "");
    const apps = {};
    const Program = await import(`file://${dir}/${appname}`).catch((err) => {
      console.error(AppName);
      console.error(err);
      return {};
    });
    for (const item in Program) {
      if (Program[item].prototype) {
        if (apps.hasOwnProperty(item)) {
          console.error(`[同名class export]  ${item}`);
        }
        apps[item] = Program[item];
      } else {
        console.error(`[非class export]  ${item}`);
      }
    }
    await synthesis(apps, AppName);
    ExampleArr.push(AppName);
  }
  return;
}

/**
 * 加载应用插件
 * @param dir
 */
async function loadPlugins(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  let flies = readdirSync(dir);
  // 识别并执行插件
  for await (let appname of flies) {
    // 优先考虑ts
    if (existsSync(`${dir}/${appname}/index.ts`)) {
      await import(`file://${dir}/${appname}/index.ts`).catch((err) => {
        console.error(appname);
        console.error(err);
        process.exit();
      });
    }
    // 发现是js
    else if (existsSync(`${dir}/${appname}/index.js`)) {
      await import(`file://${dir}/${appname}/index.js`).catch((error) => {
        console.error(appname);
        console.error(error);
        process.exit();
      });
    }
  }
  const APPARR = getAppKey();
  // 获取插件方法
  for await (let item of APPARR) {
    const apps = getApp(item);
    await synthesis(apps, item);
    PluginsArr.push(item);
    delApp(item);
  }
  return;
}

// 初始化应用
function dataInit() {
  ExampleArr = [];
  PluginsArr = [];
  Command = {
    // 频道|别野消息
    [EventEnum.GUILD_MESSAGE]: [],
    // 子频道|房间消息
    [EventEnum.CHANNEL_MESSAGE]: [],
    // 成员进出消息
    [EventEnum.MEMBER_MESSAGE]: [],
    // 审核消息
    [EventEnum.AUDIT_MESSAGE]: [],
    // 会话消息
    [EventEnum.MESSAGES]: [],
    // 会话消息
    [EventEnum.message]: [],
    // 私聊会话消息
    [EventEnum.PRIVATE_MESSAGE]: [],
    // 论坛主题
    [EventEnum.FORUMS_THREAD]: [],
    // 论坛POST
    [EventEnum.FORUMS_POST]: [],
    // 论坛评论
    [EventEnum.FORUMS_REPLY]: [],
    // 表态消息
    [EventEnum.REACTIONS_MESSAGE]: [],
    // 音频事件
    [EventEnum.AUDIO_FREQUENCY]: [],
    // 麦克风事件
    [EventEnum.AUDIO_MICROPHONE]: [],
    // 兼容但不响应
    "notice.*.poke": [],
  };
  return;
}

// 启动加载
export async function cmdInit() {
  dataInit();
  await loadPlugins(join(process.cwd(), "/plugins"));
  await loadExample(join(process.cwd(), "/example"));
  for (let val in Command) {
    Command[val] = lodash.orderBy(Command[val], ["priority"], ["asc"]);
  }
  console.log(
    `[LOAD] Plugins*${PluginsArr.length} Example*${ExampleArr.length}`
  );
  return;
}

// 插件类型
export enum AppsType {
  // 简单插件
  example = "example",
  // 应用插件
  plugins = "plugins",
}

/**
 * 得到插件信息
 * @param key 插件类型
 * @returns
 */
export async function getLoadMsg(key: AppsType) {
  return {
    example: () => ExampleArr,
    plugins: () => ExampleArr,
  }[key];
}

// 指令匹配
export async function InstructionMatching(e: MessageEvent) {
  // 是撤回,直接返回
  if (e.message.recall) return true;
  // 找不到归属
  if (!Command[e.event.belong]) return true;

  // 子频道对话机
  const stateChannel = await getConversationState(e.channel.id);
  const handlerChannel = conversationHandlers.get(e.channel.id);
  if (handlerChannel && stateChannel) {
    await handlerChannel(e, stateChannel);
    return true;
  } else {
    // 没有子频道对话机的时候,单用户对话机才能生效
    // 单用户对话机
    const stateUser = await getConversationState(e.user.id);
    const handlerUser = conversationHandlers.get(e.user.id);
    if (handlerUser && stateUser) {
      await handlerUser(e, stateUser);
      return true;
    }
  }

  // 消息类型兼容层
  const msgarr = ["MESSAGES"];
  if (e.event.belong == "MESSAGES") {
    msgarr.push("message");
  }
  for await (let item of msgarr) {
    // 发现有message  eventType需要变为undefined
    if (item == "message") {
      e.event.belong = EventEnum.message;
      e.event.type = undefined;
    }
    // 循环所有指令
    for await (let val of Command[e.event.belong]) {
      const { reg, belong, type, AppName, fncName, fnc } = val;
      if (reg === undefined) continue;
      if (!new RegExp(reg).test(e.message.text)) continue;
      // 类型不同
      if (e.event.type != type) continue;
      try {
        const AppFnc = getMessage(AppName);
        if (typeof AppFnc == "function") e = AppFnc(e);
        const res = await fnc(e)
          .then((res: boolean) => {
            console.info(
              `[${belong}][${type}][${AppName}][${fncName}][${true}]`
            );
            return res;
          })
          .catch((err: any) => {
            console.error(
              `[${belong}][${type}][${AppName}][${fncName}][${false}]`
            );
            console.error(err);
            return false;
          });
        if (res) break;
      } catch (err) {
        console.error(`[${belong}][${type}][${AppName}][${fncName}][${false}]`);
        console.error(err);
        return false;
      }
    }
  }
}

/**
 * 不匹配指令的方法
 * 只用匹配类型函数
 * @param e
 * @returns
 */
export async function typeMessage(e: MessageEvent) {
  // 找不到归属
  if (!Command[e.event.belong]) return true;
  for (const val of Command[e.event.belong]) {
    const { belong, type, AppName, fncName, fnc } = val;
    // 类型不同
    if (e.event.type != type) continue;
    try {
      const AppFnc = getMessage(AppName);
      if (typeof AppFnc == "function") e = AppFnc(e);
      const res = await fnc(e)
        .then((res: boolean) => {
          console.info(`[${belong}][${type}][${AppName}][${fncName}][${true}]`);
          return res;
        })
        .catch((err: any) => {
          console.error(
            `[${belong}][${type}][${AppName}][${fncName}][${false}]`
          );
          console.error(err);
          return false;
        });
      if (res) break;
    } catch (err) {
      console.error(`[${belong}][${type}][${AppName}][${fncName}][${false}]`);
      console.error(err);
      return false;
    }
  }
}
