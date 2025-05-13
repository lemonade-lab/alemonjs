import React from 'react'
import { BT, Format, useSends } from 'alemonjs/jsx'
import { platform, useMode } from '@alemonjs/qq-bot'
export const regular = /^(#|\/)?button-jsx$/
const selects = onSelects([
  'message.create',
  'private.message.create',
  'interaction.create',
  'private.interaction.create'
])
const response = onResponse(selects, event => {
  const [send] = useSends(event)
  const isMode = useMode(event)
  if (event.Platform == platform && isMode('group')) {
    send(
      <Format>
        <BT.template id="appid_1742790363" />
      </Format>
    )
  }
})
export default response
