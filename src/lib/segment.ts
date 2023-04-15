export const segment = {
  /**
   * 创建at元素
   * @param uid
   * @returns
   */
  at: (uid: string) => `<@!${uid}>`,
  /**
   * 创建at全体元素
   * @returns
   */
  atall: () => `<@!everyone>`,
  /**
   * 创建表情元素
   * @param type
   * @param id
   * @returns
   */
  face: (type: string | number, id: string | number) => `<${type}:${id}>`,
  /**
   * 转发消息转为卡片消息
   * @param data
   * @returns
   */
  forwardMsg: (data: string[] = []) => {
    const msgdata: any = []
    data.forEach((item: string) => {
      msgdata.push({
        obj_kv: [
          {
            key: 'desc',
            value: item
          }
        ]
      })
    })
    return {
      ark: {
        template_id: 23,
        kv: [
          {
            key: '#LIST#',
            obj: msgdata
          }
        ]
      }
    }
  },
  image: () => {}, //创建图片元素
  video: () => {} //创建视频元素
}
