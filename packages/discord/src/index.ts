import { DCClient } from 'chat-space'
import { ConfigType } from 'alemonjs'
/**
 *
 * @param val
 */
export const login = (val: ConfigType) => {
  // 如何能开放接口
  const client = new DCClient({
    token: val.token
  })
  client.connect()
}
