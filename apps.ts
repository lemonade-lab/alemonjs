import { APlugin, AMessage } from './src/index.js'
export class PluginName extends APlugin {
  constructor() {
    super({
      dsc: '插件描述',
      rule: [
        {
          reg: /正则表达式/,
          fnc: 'test',
          dsc: '/正则',
          doc: '这条正则的意思'
        }
      ]
    })
  }
  async test(e: AMessage) {
    e.reply('回复内容')
    return
  }
}
