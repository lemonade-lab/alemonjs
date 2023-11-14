import { everyoneError } from '../../log/index.js'
import IMGS from 'image-size'
import { getUrlbuffer } from '../../core/index.js'

/**
 * 客户端控制器
 * @param select
 * @returns
 */
export const ClientController = (data: {
  guild_id: string
  channel_id: string
  msg_id: string
  send_at: number
}) => {
  return (select?: {
    guild_id?: string
    channel_id?: string
    msg_id?: string
    send_at?: number
  }) => {
    const guild_id = select?.guild_id ?? data.guild_id
    const channel_id = select?.channel_id ?? data.channel_id
    const msg_id = select?.msg_id ?? data.msg_id
    const send_at = select?.send_at ?? data.send_at
    return {
      quote: async (
        content: Buffer | string | number | (Buffer | number | string)[]
      ) => {},
      withdraw: async () => {},
      pinning: async (cancel?: boolean) => {},
      forward: async () => {},
      horn: async (cancel?: boolean) => {},
      emoji: async (msg: any[], cancel?: boolean) => {},
      card: async (msg: any[]) => {}
    }
  }
}
