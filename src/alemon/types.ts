import { Messagetype } from 'alemon'
export interface ConfigType {
  Rcf: {
    host: string
    port: number
    password: string
  }
  PuPcf: {
    chromePath: string
    downloadPath: string
  }
}
export interface AlemonMsgType extends Messagetype {
  replyPrivate: (
    e: Messagetype,
    msg?: string | object | Array<string>,
    obj?: object
  ) => Promise<boolean>
}
