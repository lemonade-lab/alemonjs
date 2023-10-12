import { AvailableIntentsEventsEnum } from 'qq-guild-bot'
export default {
  appID: '',
  token: '',
  masterID: '',
  password: '',
  intents: [
    'GUILDS',
    'GUILD_MEMBERS',
    'DIRECT_MESSAGE',
    'PUBLIC_GUILD_MESSAGES'
  ] as AvailableIntentsEventsEnum[],
  isPrivate: false,
  sandbox: false
}
