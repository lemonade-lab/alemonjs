type callbackObjType = {
  onCreated?: () => void
  onMounted?: () => void
  unMounted?: () => void
}
type callbackType = () => callbackObjType
declare global {
  var defineChildren: (callback: callbackType) => any
}
export const defineChildren = (callback: callbackType) => callback
global.defineChildren = defineChildren
