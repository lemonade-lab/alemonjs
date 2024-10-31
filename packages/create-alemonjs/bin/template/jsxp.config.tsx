import React from 'react'
import { defineConfig } from 'jsxp'
import Word from './src/image/conponent/help'
export default defineConfig({
  routes: {
    '/word': {
      component: <Word data={'AlemonJS 跨平台开发框架'} />
    }
  }
})
