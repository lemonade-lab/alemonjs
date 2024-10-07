import React from 'react'
import { render } from 'jsxp'
import Help from '@src/image/conponent/help'
/**
 *
 * @param Props
 * @returns
 */
export const Picture = (Props: Parameters<typeof Help>[0]) => {
  return render({
    path: 'help',
    name: 'help.html',
    component: <Help {...Props} />
  })
}
