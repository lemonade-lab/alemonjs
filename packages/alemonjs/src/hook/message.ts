/**
 * 发送文本
 */
export const Text = (
  val: any,
  typing?: 'none' | 'bold' | 'block' | 'strikethrough' | 'boldItalic' | 'italic'
) => {
  //
}

/**
 *
 * @param val
 */
export const At = (user_id?: string, typing?: 'user' | 'guild' | 'channel') => {
  //
}

/**
 *
 * @param title
 * @param url
 */
export const Button = (
  title: string,
  options: {
    send?: string
    enter?: boolean
    reply?: boolean
    tip?: string
    color?: 'blue' | 'slate'
    permission?: 'user' | 'admin'
  }
) => {
  //
}

export const BtBox = (flex: 'Col' | 'Row', ...arg: any) => {
  // Box('Col',[Button('hello', 'https://www.baidu.com')])
}

/**
 * 发送文件
 */
export const Files = (val: string) => {
  //
}

/**
 *
 * @param type
 * @param val
 */
export const Video = (type: string) => {
  //
}

/**
 *
 * @param val
 */
export const Voice = (val: any) => {
  //
}

/**
 *
 * @param val
 */
export const Img = (
  val: Buffer | string,
  typing?: 'buffer' | 'file' | 'network'
) => {
  //
}

export const Link = (title: string, url: string) => {
  //
}

/**
 *
 * @param val
 */
export const Ark = (val: any) => {
  //
}

/**
 *
 * @param val
 */
export const Embed = (val: any) => {
  //
}

/**
 * 发送表态
 * @param val
 */
export const Emoji = (val: any) => {
  //
}
