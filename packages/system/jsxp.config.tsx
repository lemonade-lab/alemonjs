import React from 'react'
import { defineConfig } from 'jsxp'
import { Help } from './src/image/index'
export default defineConfig({
  routes: {
    '/help': {
      component: <Help />
    }
  }
})
