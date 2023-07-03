import { readFileSync, writeFileSync, watch, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ScreenshotOptions } from "puppeteer";
import template from "art-template";
import lodash from "lodash";

/* 非依赖引用 */
import { screenshot } from "./puppeteer.js";
/*模板缓存*/
let html = {};

/*监听器*/
let watcher = {};

/**
 * 缓存监听
 * @param tplFile 模板地址
 * @returns
 */
function watchCT(tplFile: string) {
  //监听存在,直接返回
  if (watcher[tplFile]) return;
  //监听不存在,增加监听
  watcher[tplFile] = watch(tplFile)
    .on("change", () => {
      //模板改变,删除模板
      delete html[tplFile];
      console.info("[HTML][UPDATA]", tplFile);
    })
    .on("close", () => {
      //监听器被移除,删除监听器
      delete watcher[tplFile];
    });
}

let AdressCache = {};

/**
 * 插件截图
 * @param AppName 插件名
 * @param tplFile 模板地址模板地址
 * @param directory 拼接地址
 * @param PageName 文件名
 * @param data 模板插入的数据
 * @param SOptions 截图参数
 * @returns
 */
export async function createPicture(
  AppName: string,
  tplFile: string,
  directory: string,
  PageName: string,
  data: object,
  SOptions?: ScreenshotOptions
): Promise<string | boolean | Buffer> {
  /** 创建目录地址 */
  const PathHtml = join(process.cwd(), "data", AppName, "html", directory);
  /* 创建文件地址 */
  const AdressHtml = join(PathHtml, `/${PageName}.html`);
  /* 确保目录存在 */
  mkdirSync(PathHtml, { recursive: true });
  /* 判断初始模板是否改变 */
  let T = false;
  if (!html[tplFile]) {
    try {
      //如果不存在,则读取模板
      html[tplFile] = readFileSync(tplFile, "utf8");
    } catch (err) {
      console.error("[HTML][ERROR]", tplFile, err);
      return false;
    }
    //读取后监听文件
    watchCT(tplFile);
    T = true;
  }
  //如果数据不相等,需要更新数据
  if (!lodash.isEqual(AdressCache[AdressHtml], data)) {
    AdressCache[AdressHtml] = data;
    T = true;
  }
  //模板更改和数据更改都会生成生成html
  if (T) {
    writeFileSync(
      AdressHtml,
      template.render(html[tplFile], AdressCache[AdressHtml])
    );
    console.info("[HTML][CREATE]", AdressHtml);
  }
  /* 截图 */
  const Buffer = await screenshot(AdressHtml, {
    type: SOptions.type || "jpeg",
    quality: SOptions.quality || 90,
    ...SOptions,
  }).catch((err: any) => {
    console.error(err);
    return false;
  });
  /* 截图 */
  return Buffer;
}
