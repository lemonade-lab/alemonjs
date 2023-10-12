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
  ]
} as PuppeteerLaunchOptions
