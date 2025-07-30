import KoaRouter from 'koa-router'
const router = new KoaRouter({
  prefix: '/'
})
// 响应服务在线
router.get('/online', ctx => {
  ctx.status = 200
  ctx.body = {
    code: 200,
    message: 'service online',
    data: null
  }
})
export default router
