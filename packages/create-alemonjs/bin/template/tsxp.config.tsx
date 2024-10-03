import React from 'react'
import { defineConfig } from 'react-puppeteer'
import { defineOptions } from './src/image/index'
import Word from './src/image/conponent/help'
export default defineConfig([
  {
    url: '/',
    options: {
      ...defineOptions,
      html_body: <Word data={'AlemonJS 跨平台开发框架'} />
    }
  }
])
