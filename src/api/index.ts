/**
 * ***********
 * SDK接口管理
 * ***********
 */
export { ClientQQ } from '../qq/index.js'
export { ClientVILLA } from '../villa/index.js'
export { ClientNTQQ } from '../ntqq/index.js'
export { ClientKOOK } from '../kook/index.js'
export { ClientDISOCRD } from '../discord/index.js'
export { ClientKOA } from '../koa/index.js'
/**
 * ************
 * Controllers
 * ************
 */
import { Controllers as ControllerVILLA } from '../villa/alemon/controller.js'
import { Controllers as ControllerQQ } from '../qq/alemon/controller.js'
import { Controllers as ControllerDISCORD } from '../discord/alemon/controller.js'
import { Controllers as ControllerNTQQ } from '../ntqq/alemon/controller.js'
import { Controllers as ControllerKOOK } from '../kook/alemon/controller.js'
import { BaseConfig, ControllerOption, ControllersType } from '../core/index.js'

/**
 * 控制器缓存
 */
export const AControllers = new BaseConfig<{
  [key: string]: ControllersType
  villa: typeof ControllerVILLA
  qq: typeof ControllerQQ
  discord: typeof ControllerDISCORD
  ntqq: typeof ControllerNTQQ
  kook: typeof ControllerKOOK
}>({
  villa: ControllerVILLA,
  qq: ControllerQQ,
  discord: ControllerDISCORD,
  ntqq: ControllerNTQQ,
  kook: ControllerKOOK
})

/**
 * 控制器工厂
 * @param select
 * @returns
 */
export function Controllers(select?: ControllerOption) {
  const platform = AControllers.get(select.platform)
  return new platform(select)
}
