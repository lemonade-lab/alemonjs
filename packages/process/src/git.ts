import simpleGit from 'simple-git'
import { sendNotification, sendGitClone } from './send'
/**
 * @param {*} repoUrl
 */
export async function cloneRepo(repoUrl: string) {
  const url = repoUrl.split('/').pop()
  if (!url) return
  // 得到仓库名
  const repoName = url.replace('.git', '')
  const git = simpleGit()
  const localPath = './packages/' + repoName
  try {
    // 深度
    // 分支
    await git.clone(repoUrl, localPath, ['--depth', '1'])
    sendNotification(`克隆仓库成功: ${repoName}`)
  } catch (err) {
    if (!err) return
    sendGitClone(0)
    if (!err['message']) return
    sendNotification(`克隆仓库时出错: ${err['message']}`, 'error')
    console.error('克隆仓库时出错:', err['message'])
  }
}

/**
 *
 * @param data
 */
export const gitClone = (data: string) => {
  cloneRepo(data)
}
