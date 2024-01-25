import { BaseConfig } from '../core/index.js'
export const DrawingBed = new BaseConfig<{
  func: (val: Buffer) => Promise<string | false>
  state: boolean
}>({
  func: async () => false,
  state: false
})
