import puppeteer, { Browser, PuppeteerLaunchOptions } from "puppeteer";
import { ScreenshotType } from "./types.js";

//截图记录
let pic: number = 0;

//重启控制
const RestartControl: number = 30;

//实例
let browser: Browser;

//实例控制
let isBrowser: boolean = false;

//实例配置
let LaunchCfg: PuppeteerLaunchOptions;

/**
 * 配置浏览器参数
 * @param val
 */
export function setLanchConfig(val: PuppeteerLaunchOptions) {
  LaunchCfg = val;
}

/**
 * 截图并返回buffer
 * @param htmlPath 绝对路径
 * @param tab 截图元素位
 * @param type 图片类型
 * @param quality 清晰度
 * @param timeout 响应检查
 * @returns
 */
export async function screenshot(
  htmlPath: string | Buffer | URL,
  tab: string,
  type?: ScreenshotType,
  quality?: number,
  timeout?: number
): Promise<string | false | Buffer> {
  // 检测是否开启
  if (isBrowser == false) {
    console.info("[puppeteer]实例启动");
    if (!(await startChrom())) return false;
  }
  if (pic <= RestartControl) {
    pic++;
  } else {
    pic = 0;
    console.info("[puppeteer]过载关闭");
    isBrowser = false;
    browser.close().catch((err) => console.error(err));
    console.info("[puppeteer]重启准备");
    if (!(await startChrom())) return false;
    pic++;
  }
  const Bufferdata = await startPage(htmlPath, tab, type, quality, timeout);
  return Bufferdata;
}

/**
 *
 * @param htmlPath 绝对路径
 * @param tab 截图元素位
 * @param type 图片类型
 * @param quality 清晰度
 * @param timeout 响应检查
 * @returns
 */
export async function startPage(
  htmlPath: string | Buffer | URL,
  tab: string,
  type?: ScreenshotType,
  quality?: number,
  timeout?: number
): Promise<string | false | Buffer> {
  try {
    if (!isBrowser) {
      console.info("[puppeteer]实例启动");
      if (!(await startChrom())) return false;
    }
    console.log("[puppeteer]开始截图");
    /* 实例化 */
    const page = await browser.newPage();
    /* 挂载网页 */
    await page.goto(`file://${htmlPath}`, {
      timeout: timeout ? timeout : 120000,
    });
    /* 获取元素 */
    const body = await page.$(tab);
    /* 得到图片 */
    const Buffer = await body.screenshot({
      type: type ? type : "jpeg",
      quality: quality ? quality : 70,
    });
    console.info("[puppeteer]截图成功");
    return Buffer;
  } catch (err) {
    console.error(err);
    return false;
  }
}

/**
 * 启动浏览器
 * @returns
 */
export async function startChrom(): Promise<boolean> {
  try {
    browser = await puppeteer.launch(LaunchCfg);
    isBrowser = true;
    console.info("[puppeteer]启动成功");
    return true;
  } catch (err) {
    console.error(err);
    isBrowser = false;
    console.info("[puppeteer]启动失败");
    return false;
  }
}
