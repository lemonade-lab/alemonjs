import { NtQQEventsEnum } from '../default/types.js'
export default {
  appID: '',
  token: '',
  secret: '',
  masterID: '',
  password: '',
  intents: [
    'GROUP_AT_MESSAGE_CREATE',
    'C2C_MESSAGE_CREATE'
  ] as NtQQEventsEnum[],
  shard: [0, 1],
  port: 9090,
  size: 999999,
  img_url: '/api/mys/img',
  IMAGE_DIR: '/data/mys/img',
  http: 'http'
}
