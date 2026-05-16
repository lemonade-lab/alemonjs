import KoaRouter from 'koa-router';
import hello from './hello.html';

const router = new KoaRouter({
  prefix: '/'
});

router.get('/', ctx => {
  ctx.status = 200;
  ctx.set('Content-Type', 'text/html; charset=utf-8');
  ctx.body = hello;
});

// 响应服务在线
router.get('api/online', ctx => {
  ctx.status = 200;
  ctx.body = {
    code: 200,
    message: 'service online',
    data: null
  };
});

export { router as default };
