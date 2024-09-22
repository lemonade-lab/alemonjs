import { type IntentsEnum } from './types.js'
export function getIntents(intents: IntentsEnum[]) {
  let result = 0
  for (const intent of intents) {
    result |= intent
  }
  return result
}
