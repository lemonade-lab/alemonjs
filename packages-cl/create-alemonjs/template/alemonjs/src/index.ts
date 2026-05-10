import { Router, logger } from 'alemonjs';
import expose from './expose';

const router = Router.create({
  // 只选择有消息的事件
  events: ['message.create', 'private.message.create', 'interaction.create', 'private.interaction.create']
});

const appGroup = router.group({ // 精准规则匹配，复杂度 O1，稳定 且 几乎无损耗
  routeText: {
    prefixes: ['/', '#', '＃', '!', '！'],   // 允许使用的前缀
    stripPrefix: true, // 匹配时去掉前缀 
    allowBare: true  // 允许不使用前缀 
  }
})

appGroup.use("hello", () => import('./response/hello'))
appGroup.use("help", () => import('./response/help'))

export default defineChildren({
  // 注册内容
  register() {
    return {
      responseRouter: router.define,
      expose: expose
    };
  },
  // 当注册完成时
  onCreated() {
    logger.info('本地测试启动');
  }
});
