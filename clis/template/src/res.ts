import { lazy } from 'alemonjs';

/**
 * 把不是最终的节点视为中间件。
 * 最终节点视为响应。
 * 如果正则可用。将会进行正则匹配。拦截到就不继续往下走了。
 * 如果正则不可用。将会继续往下走。
 * 走到最后。如果发现中间件有select不相同。将放弃响应。继续寻找其他响应。
 */

export default defineResponse([
  {
    // 中间件。注意中间件可以根据 select 进行过滤。需要注意select的范围
    handler: lazy(() => import('./mw/mw')),
    children: [
      {
        // 正则匹配
        regular: /^(#|\/)image/,
        handler: lazy(() => import('./response/image/res'))
      }
    ]
  }
]);
