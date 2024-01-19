/**
 * ***********
 * clinent
 * ***********
 */
export { ClientQQ } from '../platform/qq/index.js'
export { ClientVILLA } from '../platform/villa/index.js'
export { ClientNTQQ } from '../platform/ntqq/index.js'
export { ClientKOOK } from '../platform/kook/index.js'
export { ClientDISOCRD } from '../platform/discord/index.js'
export { ClientKOA } from '../koa/index.js'

/**
 * ************
 * controllers
 * ************
 */
import { Controllers as ControllerVILLA } from '../platform/villa/alemon/controller.js'
import { Controllers as ControllerQQ } from '../platform/qq/alemon/controller.js'
import { Controllers as ControllerDISCORD } from '../platform/discord/alemon/controller.js'
import { Controllers as ControllerNTQQ } from '../platform/ntqq/alemon/controller.js'
import { Controllers as ControllerKOOK } from '../platform/kook/alemon/controller.js'
import { BaseConfig } from '../core/index.js'
import { type ControllerOption, type ControllersType } from '../core/index.js'

/**
 * *********
 * AControllers
 * ***********
 */
export const AControllers = new BaseConfig<{
  [key: string]: ControllersType
}>({
  villa: ControllerVILLA,
  qq: ControllerQQ,
  discord: ControllerDISCORD,
  ntqq: ControllerNTQQ,
  kook: ControllerKOOK
})

/**
 * controllers reate
 * @param select
 * @returns
 */
export function Controllers(select: ControllerOption) {
  const platform = AControllers.get(select.platform)
  return new platform(select)
}
