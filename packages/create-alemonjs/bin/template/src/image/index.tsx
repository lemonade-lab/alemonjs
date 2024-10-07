import React from 'react'
import { render, ObtainProps } from 'jsxp'
import Help from '@src/image/conponent/help'
/**
 *
 * @param Props
 * @returns
 */
export const Picture = (Props: ObtainProps<typeof Help>) => {
  return render({
    path: 'help',
    name: 'help.html',
    component: <Help {...Props} />
  })
}
