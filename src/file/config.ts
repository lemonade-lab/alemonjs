import { FileOptions } from './types.js'
import { BaseConfig } from '../core/index.js'
import { DefaultFileOptions } from './default.js'
export const FileConfig = new BaseConfig<FileOptions>(DefaultFileOptions)
