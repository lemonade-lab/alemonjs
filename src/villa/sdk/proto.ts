import protobuf from 'protobufjs'

export const commandEnum = [
  'PLogin',
  'PLoginReply',
  'PLogout',
  'PLogoutReply',
  'CommonReply',
  'PKickOff',
  'PHeartBeatReply',
  'PHeartBeatType',
  'PHeartBeat'
] as const

export const command: {
  [key in (typeof commandEnum)[number]]: protobuf.Type
} = {} as any

//  .proto 文件中的消息类型
protobuf.load('proto/command.proto', function (err, root) {
  if (err) throw err
  command['PLogin'] = root.lookupType('vila_bot.PLogin')
  command['PLoginReply'] = root.lookupType('vila_bot.PLoginReply')
  command['PLogout'] = root.lookupType('vila_bot.PLogout')
  command['PLogoutReply'] = root.lookupType('vila_bot.PLogoutReply')
  command['CommonReply'] = root.lookupType('vila_bot.CommonReply')
  command['PKickOff'] = root.lookupType('vila_bot.PKickOff')
  command['PHeartBeatReply'] = root.lookupType('vila_bot.PHeartBeatReply')
  command['PHeartBeatType'] = root.lookupType('vila_bot.PHeartBeat')
  command['PHeartBeat'] = root.lookupType('vila_bot.PHeartBeat')
})

export const modelEnum = [
  'RobotTemplate',
  'Robot',
  'QuoteMessageInfo',
  'RobotEvent'
] as const

export const model: {
  [key in (typeof modelEnum)[number]]: protobuf.Type
} = {} as any

//  .proto 文件中的消息类型
protobuf.load('proto/model.proto', function (err, root) {
  if (err) throw err
  model['RobotTemplate'] = root.lookupType('vila_bot.RobotTemplate')
  model['Robot'] = root.lookupType('vila_bot.Robot')
  model['QuoteMessageInfo'] = root.lookupType('vila_bot.QuoteMessageInfo')
  model['RobotEvent'] = root.lookupType('vila_bot.RobotEvent')
})

//  .proto 文件中的消息类型
protobuf.load('proto/robot_event_message.proto', function (err, root) {
  if (err) throw err
  //
})

/**
 * 控制器
 * @param key
 * @returns
 */
export const ProtoModel = (key: (typeof modelEnum)[number]) => {
  const control = model[key]
  return {
    /**
     * 构造
     * @param data
     * @returns
     */
    encode: (data: { [k: string]: any }) => {
      const message = control.create(data)
      return control.encode(message).finish()
    },
    /**
     * 解析
     * @param reader
     * @returns
     */
    decode: (reader: Uint8Array) => {
      return control.decode(reader) as any
    }
  }
}

/**
 * 控制器
 * @param key
 * @returns
 */
export const ProtoCommand = (key: (typeof commandEnum)[number]) => {
  const control = command[key]
  return {
    /**
     * 构造
     * @param data
     * @returns
     */
    encode: (data: { [k: string]: any }) => {
      const message = control.create(data)
      return control.encode(message).finish()
    },
    /**
     * 解析
     * @param reader
     * @returns
     */
    decode: (reader: Uint8Array) => {
      return control.decode(reader) as any
    }
  }
}
