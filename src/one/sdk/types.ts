export interface Heartbeat {
  id: string
  impl: string
  version: number
  platform: string
  self: {
    platform: string
    user_id: string
  }
  self_id: string
  time: number
  detail_type: string
  type: string
  sub_type: string
  interval: number
  status: {
    good: boolean
    bots: Bot[]
  }
}

interface Bot {
  self: {
    user_id: string
    platform: string
    nickname: string
    user_displayname: string
  }
  online: true
}

/**
 * event {
  id: '3a4b85df-e9ec-7433-e422-9783d0ec6c4b',
  impl: 'onebots',
  version: 12,
  platform: 'qq',
  self: { platform: 'qq', user_id: '717505091' },
  self_id: '717505091',
  time: 1698731572,
  detail_type: 'heartbeat',
  type: 'meta',
  sub_type: '',
  interval: 1698731575565,
  status: { good: true, bots: [ [Object] ] }
}
status.bots [
  {
    self: {
      user_id: '717505091',
      platform: 'qq',
      nickname: '归雨',
      user_displayname: ''
    },
    online: true
  }
]
 */

export interface Event {
  id: string
  impl: string
  version: number
  platform: string
  self: {
    user_id: string
    platform: string
    nickname: string
    user_displayname: string
  }
  self_id: number
  time: number
  detail_type: string
  type: string
  sub_type: string
  post_type: string
  message_id: string
  user_id: string
  seq: number
  rand: number
  font: string
  message: Message[]
  raw_message: string
  message_type: string
  sender: {
    user_id: number
    nickname: string
  }
  from_id: number
  to_id: number
  auto_reply: boolean
  friend: {
    user_id: number
    nickname: string
    sex: string
    remark: string
    class_id: number
  }
  cqCode: string
  alt_message: string
}

interface Message {
  type: string
  data: any
}

/**
 * event {
  id: '8db14cf7-05f4-38be-ee01-9aac702bc651',
  impl: 'onebots',
  version: 12,
  platform: 'qq',
  self: {
    user_id: '717505091',
    platform: 'qq',
    nickname: '归雨',
    user_displayname: ''
  },
  self_id: 717505091,
  time: 1698731573,
  detail_type: 'private',
  type: 'message',
  sub_type: 'friend',
  post_type: 'message',
  message_id: 'ZkO2ZgAAh4BBLBw6ZUCWNQA=',
  user_id: '1715713638',
  seq: 34688,
  rand: 1093409850,
  font: '宋体',
  message: [ { type: 'text', data: [Object] } ],
  raw_message: '测试',
  message_type: 'private',
  sender: { user_id: 1715713638, nickname: '柠檬冲水' },   
  from_id: 1715713638,
  to_id: 717505091,
  auto_reply: false,
  friend: {
    user_id: 1715713638,
    nickname: '柠檬冲水',
    sex: 'unknown',
    remark: '柠檬冲水',
    class_id: 0
  },
  cqCode: '测试',
  alt_message: '测试'
}
 */

export interface EventGroup {
  id: string
  impl: string
  version: number
  platform: string
  self: {
    user_id: string
    platform: string
    nickname: string
    user_displayname: string
  }
  self_id: number
  time: number
  detail_type: string
  type: string
  sub_type: string
  post_type: string
  message_id: string
  user_id: string
  seq: number
  rand: number
  font: string
  message: {
    type: string
    data: any // You can provide a more specific type if known
  }[]
  raw_message: string
  message_type: string
  sender: {
    user_id: number
    nickname: string
    sub_id: number
    card: string
    sex: string
    age: number
    area: string
    level: number
    role: string
    title: string
  }
  group_id: string
  group_name: string
  block: boolean
  anonymous: null | any // You can provide a more specific type if known
  atme: boolean
  atall: boolean
  group: {
    group_id: number
    group_name: string
    member_count: number
    max_member_count: number
    owner_id: number
    admin_flag: boolean
    last_join_time: number
    last_sent_time: number
    shutup_time_whole: number
    shutup_time_me: number
    create_time: number
    grade: number
    max_admin_count: number
    active_member_count: number
    update_time: number
  }
  member: {
    group_id: number
    user_id: number
    nickname: string
    card: string
    sex: string
    age: number
    join_time: number
    last_sent_time: number
    level: number
    role: string
    title: string
    title_expire_time: number
    shutup_time: number
    update_time: number
    area: string
    rank: string
  }
  cqCode: string
}

/**
 * event {
  id: '3a1b8df8-e554-7247-ffcc-de4e39a458e7',
  impl: 'onebots',
  version: 12,
  platform: 'qq',
  self: {
    user_id: '717505091',
    platform: 'qq',
    nickname: '归雨',
    user_displayname: ''
  },
  self_id: 717505091,
  time: 1698744390,
  detail_type: 'group',
  type: 'message',
  sub_type: 'normal',
  post_type: 'message',
  message_id: 'B7ruH2ZDtmYAAAnhGvChH2VAyEYB',
  user_id: '1715713638',
  seq: 2529,
  rand: 451977503,
  font: '宋体',
  message: [ { type: 'text', data: [Object] } ],
  raw_message: '柠檬帮助',
  message_type: 'group',
  sender: {
    user_id: 1715713638,
    nickname: '柠檬冲水',
    sub_id: 537183489,
    card: '',
    sex: 'unknown',
    age: 0,
    area: '',
    level: 1,
    role: 'owner',
    title: ''
  },
  group_id: '129691167',
  group_name: '归雨、柠檬冲水',
  block: false,
  anonymous: null,
  atme: false,
  atall: false,
  group: {
    group_id: 129691167,
    group_name: '归雨、柠檬冲水',
    member_count: 2,
    max_member_count: 200,
    owner_id: 1715713638,
    admin_flag: false,
    last_join_time: 1698742289,
    last_sent_time: 1698744383,
    shutup_time_whole: 0,
    shutup_time_me: 0,
    create_time: 1698742288,
    grade: 0,
    max_admin_count: 10,
    active_member_count: 0,
    update_time: 1698743921
  },
  member: {
    group_id: 129691167,
    user_id: 1715713638,
    nickname: '柠檬冲水',
    card: '',
    sex: 'unknown',
    age: 0,
    join_time: 1698742288,
    last_sent_time: 1698744391,
    level: 1,
    role: 'owner',
    title: '',
    title_expire_time: 4294967295,
    shutup_time: 0,
    update_time: 1698743921,
    area: '',
    rank: '潜水'
  },
  cqCode: '柠檬帮助',
  alt_message: '柠檬帮助'
}
 */
