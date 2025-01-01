import Res from '@src/apps/cwd'
export const name = 'core:image'
export default OnResponse(
  [
    Res.current,
    event => {
      console.log('test')
    }
  ],
  ['message.create', 'private.message.create']
)
