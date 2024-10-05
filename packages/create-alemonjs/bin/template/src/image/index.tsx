import React from 'react'
import { render, LinkCSS } from 'react-puppeteer'
import Help from '@src/image/conponent/help'
import css_output from '@public/output.css'
import css_main from '@public/main.css'
export const defineOptions = {
  html_head: (
    <>
      <LinkCSS src={css_output} />
      <LinkCSS src={css_main} />
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
