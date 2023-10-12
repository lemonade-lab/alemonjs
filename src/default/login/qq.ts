import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
export default {
  appID: '',
  token: '',
  masterID: '',
  password: '',
  intents: [
    AvailableIntentsEventsEnum.GUILDS,
    AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES,
    AvailableIntentsEventsEnum.DIRECT_MESSAGE,
    AvailableIntentsEventsEnum.GUILD_MEMBERS
  ] as AvailableIntentsEventsEnum[],
  isPrivate: false,
  sandbox: false
}
