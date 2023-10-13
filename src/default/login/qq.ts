import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
export default {
  appID: '',
  token: '',
  secret: '',
  masterID: '',
  password: '',
  intents: [
    AvailableIntentsEventsEnum.GUILDS,
    AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES,
    AvailableIntentsEventsEnum.DIRECT_MESSAGE
  ] as AvailableIntentsEventsEnum[],
  isPrivate: false,
  sandbox: false
}
