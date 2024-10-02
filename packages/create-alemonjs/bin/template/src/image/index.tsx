import React from 'react'
import { dirname } from 'path'
import { render, createRequire } from 'react-puppeteer'
import Help from './conponent/help'
const require = createRequire(import.meta.url)

/**
 *
 */
export const defineOptions = {
  file_paths: {
    // 定位自身的 md文件，并获取目录地址
    '@bot': dirname(require('../../README.md'))
  },
  html_head: (
    <>
      <link href={require('../../public/output.css')} />
      <link href={require('../../assets/css/main.css')} />
    </>
  )
}

/**
 *
 * @param Props
 * @returns
 */
export const Picture = (Props: Parameters<typeof Help>[0]) => {
  return render({
    ...defineOptions,
    join_dir: 'help',
    html_name: `help.html`,
    html_body: <Help {...Props} />
  })
}
