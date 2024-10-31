/**
 * 变量模块存储
 */
class StoreCore {
  RESTART_KEY = 'alemonjs:restart'
  RESTART_ACTION_KEY = 'alemonjs:restart:action'
  PM2_CONFIG_DIR = 'pm2.config.cjs'
}
/**
 * 变量存储器
 */
export const Store = new StoreCore()
