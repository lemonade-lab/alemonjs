import React from 'react'
import { renderToString } from 'react-dom/server'
import { MainCSS, OutputCss } from '../../url.js'
/**
 * 得到基础link组件
 * @returns
 */
export const getLink = () => {
  return renderToString(
    <>
      <link rel="stylesheet" href={OutputCss} />
      <link rel="stylesheet" href={MainCSS} />
    </>
  )
}
