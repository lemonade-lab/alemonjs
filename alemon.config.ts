import { defineAlemonConfig } from './src/index.js'
/**
 * **********
 * 配置式启动
 * **********
 */

/**
 * 不配置插件地址就不启动插件
 *
 * 不配置应用地址就不启动
 *
 * 所以东西都必须是配置出来的
 *
 * 不配置就不执行
 */
export default defineAlemonConfig({})
