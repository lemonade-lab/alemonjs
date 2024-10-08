import React from 'react'
import { render } from 'jsxp'
import { Help } from './component/index'
/**
 * @param Props
 * @returns
 */
export const screenshotRender = () => {
  return render({
    path: 'system',
    name: 'help.html',
    component: <Help />
  })
}
export * from './component/index'
