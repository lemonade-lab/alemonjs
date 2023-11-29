import { PuppeteerLaunchOptions } from 'puppeteer'
export default {
  headless: process.env?.ALEMONJS_PUPPERTEER_HEADLESS ?? 'new',
  timeout: Number(process.env?.ALEMONJS_PUPPERTEER_TIMEOUT ?? 30000),
  args: [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
    '--single-process'
  ],
  skipDownload: true
} as PuppeteerLaunchOptions
