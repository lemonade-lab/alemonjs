import { C2C_MESSAGE_CREATE_TYPE } from '../message/group/C2C_MESSAGE_CREATE'
import { C2C_MSG_REJECT_TYPE } from '../message/group/C2C_MSG_REJECT'
import { C2C_MSG_RECEIVE_TYPE } from '../message/group/C2C_MSG_RECEIVE'
import { GROUP_ADD_ROBOT_TYPE } from '../message/group/GROUP_ADD_ROBOT'
import { GROUP_AT_MESSAGE_CREATE_TYPE } from '../message/group/GROUP_AT_MESSAGE_CREATE'
import { GROUP_DEL_ROBOT_TYPE } from '../message/group/GROUP_DEL_ROBOT'
import { GROUP_MSG_RECEIVE_TYPE } from '../message/group/GROUP_MSG_RECEIVE'
import { GROUP_MSG_REJECT_TYPE } from '../message/group/GROUP_MSG_REJECT'
import { FRIEND_ADD_TYPE } from '../message/group/FRIEND_ADD'
import { FRIEND_DEL_TYPE } from '../message/group/FRIEND_DEL'
import { ERROR_TYPE } from '../message/ERROR'
export type QQBotGroupEventMap = {
  C2C_MESSAGE_CREATE: C2C_MESSAGE_CREATE_TYPE
  C2C_MSG_REJECT: C2C_MSG_REJECT_TYPE
  C2C_MSG_RECEIVE: C2C_MSG_RECEIVE_TYPE
  GROUP_ADD_ROBOT: GROUP_ADD_ROBOT_TYPE
  GROUP_AT_MESSAGE_CREATE: GROUP_AT_MESSAGE_CREATE_TYPE
  GROUP_DEL_ROBOT: GROUP_DEL_ROBOT_TYPE
  GROUP_MSG_RECEIVE: GROUP_MSG_RECEIVE_TYPE
  GROUP_MSG_REJECT: GROUP_MSG_REJECT_TYPE
  FRIEND_ADD: FRIEND_ADD_TYPE
  FRIEND_DEL: FRIEND_DEL_TYPE
  ERROR: ERROR_TYPE
  // more events...
}
