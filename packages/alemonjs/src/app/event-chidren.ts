import { ConfigType } from '../typing/types'
type callbackObjType = {
  onCreated?: () => void
  onMounted?: () => void
  unMounted?: () => void
}
type callbackType = (config: ConfigType) => callbackObjType
export const defineChildren = (callback: callbackType) => callback
