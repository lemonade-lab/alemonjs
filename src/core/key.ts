export function globalKey(key: string) {
  if (!global?.alemonjs) {
    global.alemonjs = {}
  }
  if (!global.alemonjs[key]) {
    return false
  }
  return true
}
