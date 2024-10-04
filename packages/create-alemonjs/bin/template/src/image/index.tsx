import React from 'react'
import { render, createRequire, LinkCSS } from 'react-puppeteer'
import Help from './conponent/help'
const require = createRequire(import.meta.url)
export const defineOptions = {
  html_head: (
    <>
      <LinkCSS src={require('../../public/output.css')} />
      <LinkCSS src={require('../../public/main.css')} />
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
    html_name: 'help.html',
    html_body: <Help {...Props} />
  })
}
