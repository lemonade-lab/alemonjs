import { Alemon } from './processor/alemon.js'
import { Observer } from './processor/subscribe.js'
import { App } from './processor/application.js'
import { BaseConfig } from './config.js'
import { ApplicationProcessingOpsion } from './processor/configs.js'
import { APlugin } from 'alemonjs'
declare global {
  var alemonjs: {
    app?: Map<string, Alemon>
    observer?: Observer
    applications?: App
    config?: BaseConfig<ApplicationProcessingOpsion>
    plugin?: typeof APlugin
  }
}
