/**
 *
 * @param data
 * @returns
 */
export function createMessage(data: {
  ID: number
  Flag: number
  BizType: number
  AppId: number
  BodyData: Uint8Array
}) {
  const buffer = new ArrayBuffer(1024 * 1024 + 8)
  const view = new DataView(buffer)
  const fixedLength = 8
  const lenth = 24
  const variableLength = data.BodyData.length
  view.setUint32(0, 0xbabeface, true) // Magic
  view.setUint32(4, lenth + variableLength, true) // DataLen
  view.setUint32(8, lenth, true) // HeaderLen
  view.setBigUint64(12, BigInt(data.ID), true) // ID
  view.setUint32(20, data.Flag, true) // Flag
  view.setUint32(24, data.BizType, true) // BizType
  view.setInt32(28, data.AppId, true) // AppId
  const bodyData = new Uint8Array(buffer, 32, variableLength + fixedLength)
  bodyData.set(data.BodyData)
  const byteArray = new Uint8Array(
    buffer,
    0,
    fixedLength + lenth + variableLength
  )
  return byteArray
}

/**
 *
 * @param byteArray
 * @returns
 */
export function parseMessage(byteArray: Uint8Array) {
  const buffer = byteArray.buffer
  const view = new DataView(buffer)
  const Magic = view.getUint32(0, true) // Magic
  const dataLen = view.getUint32(4, true) // DataLen
  const headerLen = view.getUint32(8, true) // HeaderLen
  const ID = view.getBigUint64(12, true) // ID
  const flag = view.getUint32(20, true) // Flag
  const bizType = view.getUint32(24, true) // BizType
  const appId = view.getInt32(28, true) // AppId
  const BodyData = new Uint8Array(buffer, 32)
  const data = {
    Magic,
    dataLen,
    headerLen,
    ID,
    flag,
    bizType,
    appId,
    BodyData: BodyData
  }
  return data
}
