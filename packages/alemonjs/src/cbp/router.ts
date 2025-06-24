import KoaRouter from 'koa-router'
const router = new KoaRouter({
  prefix: '/'
})
// 测试服务是否存在
router.get('/cbp', ctx => {
  ctx.body = {
    code: 200,
    message: 'Message API is working',
    data: null
  }
})
export default router
