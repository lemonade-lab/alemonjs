import { User } from '../event/base/user'
import { DataEnums } from '../message'
export type ClientAPI = {
  api: {
    use: {
      send: (event: { [key: string]: any }, val: DataEnums[]) => Promise<any[]>
      mention: (event: { [key: string]: any }) => Promise<User[]>
    }
  }
}
