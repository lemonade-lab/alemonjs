import { BaseConfig } from '../core/config'
export const DrawingBed = new BaseConfig<{
  func: (val: Buffer) => Promise<string | false>
  state: boolean
}>({
  func: async () => false,
  state: false
})
