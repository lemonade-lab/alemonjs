import React from 'react';
import { defineConfig } from 'jsxp';
import Word from '@src/image/component/help';
export default defineConfig({
  routes: {
    '/': {
      component: <Word name={'ALemonJS 跨平台开发框架'} />
    }
  }
});
