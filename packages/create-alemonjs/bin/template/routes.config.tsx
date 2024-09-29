import React from 'react'
import { defineConfig } from 'react-puppeteer'
import { defineOptions } from './src/image/index'
import Word from './src/image/conponent/help'
import './src/input.css'
export default defineConfig([
  {
    url: '/',
    options: {
      ...defineOptions,
      html_body: <Word />
    }
  }
])
