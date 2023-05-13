import { SegmentType, ButtomMsgType } from './types'
import { emojiMap } from './emoji'
export const segment: SegmentType = {
  reply: (msg_id: string) => {
    return { message_reference: { message_id: msg_id } }
  },
  url: (image: string) => {
    return { image }
  },
  at: (uid: string) => `<@!${uid}>`,
  atall: () => `<@!everyone>`,
  expression: (type: number, id: number) => {
    return emojiMap[type][id]
  },
  face: (id: string | number) => `<emoji:${id}>`,
  channel: (channel_id: string) => `<#${channel_id}>`,
  image: (url: string) => {
    /**
     * 如果是.php
     */
    return {
      image: url
    }
  },
  video: () => {},
  embed: (title: string, prompt: string, url: string, arr: Array<any>) => {
    let fields = []
    for (let item of arr) {
      fields.push({
        name: item
      })
    }
    return {
      embed: {
        title,
        prompt,
        thumbnail: {
          url
        },
        fields
      }
    }
  },
  button: (arr: Array<ButtomMsgType>) => {
    const obj = []
    const obj_kv = []
    for (let item of arr) {
      obj_kv.push({
        key: 'desc',
        value: item.desc
      })
      if (item.link) {
        obj_kv.push({
          key: 'link',
          value: item.link
        })
      }
    }
    for (let item of obj) {
      obj.push({
        obj_kv: item
      })
    }
    return {
      ark: {
        template_id: 23,
        kv: [
          {
            key: '#PROMPT#',
            value: '示范'
          },
          {
            key: '#LIST#',
            obj
          }
        ]
      }
    }
  }
}
