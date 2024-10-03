import React from 'react'
import { render, createRequire } from 'react-puppeteer'
import Help from './conponent/help'
const require = createRequire(import.meta.url)

/**
 *
 */
export const defineOptions = {
  html_head: (
    <>
      <link href={require('../../public/output.css')} />
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
