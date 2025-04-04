import React from 'react'
import { createSelects } from 'alemonjs'
import { BT, useSend } from 'alemonjs/jsx'
import { platform, useMode } from '@alemonjs/qq-bot'
export const regular = /^(#|\/)?button-jsx$/
const selects = createSelects([
  'message.create',
  'private.message.create',
  'interaction.create',
  'private.interaction.create'
])
const response = onResponse(selects, event => {
  const Send = useSend(event)
  const isMode = useMode(event)
  if (event.Platform == platform && isMode('group')) {
    Send(<BT.template id="appid_1742790363" />)
  }
})
export default response
