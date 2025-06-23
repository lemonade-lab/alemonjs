import { onState, unState } from 'alemonjs'

const key = 'main:response:login'

const state = (val: boolean) => {
  // 订阅 key 的状态变化
}

onState(key, state)
unState(key, state)
