import { exec } from 'child_process'
/**
 *
 * @param command
 * @returns
 */
export const getCommandOutput = (command: string): Promise<string> => {
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
