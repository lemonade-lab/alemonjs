import { createPicture } from '../../api/rebot'
import { MyDirPath, AppName } from '../../app.config'
/**中间返回show与yunzai的图片方法进行对接*/
export const obtainingImages = async ({ path = '', name = '', data = {} }): Promise<any> =>
  await createPicture(name, {
    /** heml路径 */
    tplFile: `${MyDirPath}/resources/html/${path}/${name}.html`,
    /** css路径 */
    pluResPath: `${MyDirPath}`,
    AppName,
    /** 数据 */
    ...data
  }).catch(err => {
    console.error(err)
  })
