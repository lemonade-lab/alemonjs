let token = ''

let intent = 0

/**
 *
 * @param val
 */
export function setDISOCRD(val: string, i: number) {
  token = val
  intent = i
}

/**
 *
 * @returns
 */
export function getDISCORD() {
  return {
    token,
    intent
  }
}
