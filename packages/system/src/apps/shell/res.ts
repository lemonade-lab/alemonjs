import { Text, useParse, useSend } from 'alemonjs'
import { exec } from 'child_process'
/**
 *
 * @param command
 * @returns
 */
const getCommandOutput = (command: string) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout) => {
      if (error) {
        reject(error)
        return
      }
      resolve(stdout.trim())
    })
  })
}

//
export default OnResponse(
  async event => {
    const Send = useSend(event)
    if (event.IsMaster) {
      Send(Text('你不是主人'))
      return
    }
    const text = useParse(event.Megs, 'Text')
    const shell = text.replace(/^\/cwd/, '')
    getCommandOutput(shell)
      .then(res => {
        Send(Text(res.toString()))
      })
      .catch(err => {
        Send(Text(err.toString()))
      })
  },
  'message.create',
  /^\/cwd/
)
