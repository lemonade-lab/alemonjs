import { PuppeteerLaunchOptions } from 'puppeteer'
export default {
  headless: 'new',
  timeout: 30000,
  args: [
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
    '--single-process'
  ],
  skipDownload: true,
  executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
} as PuppeteerLaunchOptions
