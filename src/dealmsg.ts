import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import lodash from "lodash";
// 非依赖引用
import { Messagetype, CmdType, EType } from "./types.js";
import { getApp, delApp, getMessage } from "./message.js";
import { conversationHandlers, getConversationState } from "./dialogue.js";

/* 指令合集 */
let Command: CmdType;
let ExampleArr = [];
let PluginsArr = [];

/**
 * 应用挂载
 * @param AppsObj
 * @param appname
 * @param belong
 */
async function synthesis(AppsObj: object, appname: string, belong: string) {
  for (const item in AppsObj) {
    let keys = new AppsObj[item]();
    if (!keys["event"] || !keys["rule"]) continue;
    keys["rule"].forEach((key: any) => {
      Command[keys["event"]].push({
        reg: key["reg"],
        priority: keys["priority"],
        data: {
          event: keys["event"],
          eventType: keys["eventType"],
          belong,
          AppName: appname,
          name: item,
          dsc: keys["dsc"],
          fncName: key["fnc"],
          fnc: keys[key["fnc"]],
        },
      });
    });
  }
}

/**
 * 加载简单插件
 * @param dir
 */
async function loadExample(dir: string) {
  const belong = "example";
  /* 初始化 */
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  /* 读取文件 */
  const readDir = readdirSync(dir);
  /* 正则匹配ts文件并返回 */
  const flies = readDir.filter((item) => /.(ts|js)$/.test(item));
  for (let appname of flies) {
    if (!existsSync(`${dir}/${appname}`)) {
      continue;
    }
    const AppName = appname.replace(/\.(ts|js)$/, () => "");
    const apps = {};
    const Program = await import(`file://${dir}/${appname}`).catch((error) => {
      console.error(AppName);
      console.error(error);
      process.exit();
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
    await synthesis(apps, AppName, belong);
    ExampleArr.push(AppName);
  }
}

/**
 * 加载应用插件
 * @param dir
 */
async function loadPlugins(dir: string) {
  const belong = "plugins";
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  let flies = readdirSync(dir);
  //识别并执行插件
  const FliesName = [];
  //识别并执行插件
  for await (let appname of flies) {
    // 优先考虑ts
    if (existsSync(`${dir}/${appname}/index.ts`)) {
      await import(`file://${dir}/${appname}/index.ts`).catch((error) => {
        console.error(appname);
        console.error(error);
        process.exit();
      });
      FliesName.push(appname);
    }
    // 发现是js
    else if (existsSync(`${dir}/${appname}/index.js`)) {
      await import(`file://${dir}/${appname}/index.js`).catch((error) => {
        console.error(appname);
        console.error(error);
        process.exit();
      });
      FliesName.push(appname);
    }
  }
  //获取插件方法
  for await (let appname of FliesName) {
    const apps = getApp(appname);
    await synthesis(apps, appname, belong);
    PluginsArr.push(appname);
    delApp(appname);
  }
}

/**
 * 初始化应用
 */
function dataInit() {
  ExampleArr = [];
  PluginsArr = [];
  Command = {
    [EType.AUDIO_FREQUENCY]: [],
    [EType.AUDIO_MICROPHONE]: [],
    [EType.CHANNEL]: [],
    [EType.DIRECT_MESSAGE]: [],
    [EType.FORUMS_THREAD]: [],
    [EType.FORUMS_POST]: [],
    [EType.FORUMS_REPLY]: [],
    [EType.GUILD]: [],
    [EType.GUILD_MEMBERS]: [],
    [EType.MESSAGES]: [],
    [EType.MESSAGE_AUDIT]: [],
    [EType.INTERACTION]: [],
    [EType.GUILD_MESSAGE_REACTIONS]: [],
    [EType.message]: [],
    "notice.*.poke": [], // 兼容但不响应
  };
}

/**
 * 启动加载
 */
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
}

/**
 * 插件类型
 */
export enum AppsType {
  example = "example", // 简单插件
  plugins = "plugins", //  应用插件
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

/* 指令匹配 */
export async function InstructionMatching(e: Messagetype) {
  if (e.isRecall) return;
  // 匹配不到事件
  if (!Command[e.event]) return;

  /* 获取对话状态 */
  const state = await getConversationState(e.msg.author.id);
  /* 获取对话处理函数 */
  const handler = conversationHandlers.get(e.msg.author.id);
  if (handler && state) {
    /* 如果用户处于对话状态，则调用对话处理函数 */
    await handler(e, state);
    return;
  }

  // 消息类型兼容层
  const msgarr = ["MESSAGES"];
  if (e.event == "MESSAGES") {
    msgarr.push("message");
  }

  for await (let item of msgarr) {
    // 发现有message  eventType需要变为undefined
    if (item == "message") {
      e.event = EType.message;
      e.eventType = undefined;
    }
    /* 循环所有指令 */
    for await (let val of Command[e.event]) {
      const { reg, data } = val;
      if (reg === undefined) continue;
      if (!new RegExp(reg).test(e.cmd_msg)) continue;
      if (e.eventType != data.eventType) continue;
      try {
        const { fnc, AppName } = data;
        const AppFnc = getMessage(AppName);
        if (typeof AppFnc == "function") e = AppFnc(e);
        const res = await fnc(e).catch((err: any) => {
          console.error(err);
          return false;
        });
        if (res) break;
      } catch (err) {
        logErr(err, data);
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
export async function typeMessage(e: Messagetype) {
  if (!Command[e.event]) return;
  for (const val of Command[e.event]) {
    const { data } = val;
    if (e.eventType != data.eventType) continue;
    try {
      const { fnc, AppName } = data;
      const AppFnc = getMessage(AppName);
      if (typeof AppFnc == "function") e = AppFnc(e);
      const res = await fnc(e).catch((err: any) => {
        console.error(err);
        return false;
      });
      if (res) break;
    } catch (err) {
      logErr(err, data);
      return;
    }
  }
}

/**
 * 错误信息反馈
 * @param err
 * @param data
 */
function logErr(err: any, data: any) {
  console.error(
    `[${data.event}][${data.belong}][${data.AppName}][${data.fncName}]]`
  );
  console.error(err);
}
