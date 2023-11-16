import { defineAlemonConfig, analysis } from 'alemonjs'
import { login } from './a.login.config.js'
defineAlemonConfig({
  login: analysis(login)
})
