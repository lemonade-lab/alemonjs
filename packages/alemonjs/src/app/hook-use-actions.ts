import { ActionsEventEnum, Events } from '../typings'
import { ActionsBus } from './store'

const eventBus = new ActionsBus()

class Actions {
  constructor() {
    console.log('Actions initialized')
  }
  // 撤回
  recallMessage() {
    eventBus.publish(ActionsEventEnum.MessageRecall)
  }
  // 重新编辑
  editMessage() {
    eventBus.publish(ActionsEventEnum.MessageEdit)
  }
  // 引用
  quoteMessage() {
    eventBus.publish(ActionsEventEnum.MessageQuote)
  }
  // 转发
  forwardMessage() {
    eventBus.publish(ActionsEventEnum.MessageForward)
  }
  // 置顶
  topMessage() {
    eventBus.publish(ActionsEventEnum.MessageTop)
  }
  // 取消置顶
  unMessageTop() {
    eventBus.publish(ActionsEventEnum.MessageUntop)
  }
  // 表态
  likeMessage() {
    eventBus.publish(ActionsEventEnum.MessageLike)
  }
  // 取消表态
  unMessageLike() {
    eventBus.publish(ActionsEventEnum.MessageUnlike)
  }
  // 创建公会
  create() {
    eventBus.publish(ActionsEventEnum.GuildCreate)
  }
  // 删除公会
  delete() {
    eventBus.publish(ActionsEventEnum.GuildDelete)
  }
  // 退出公会
  quit() {
    eventBus.publish(ActionsEventEnum.GuildQuit)
  }
  // 加入公会
  join() {
    eventBus.publish(ActionsEventEnum.GuildJoin)
  }
  // 成员列表
  members() {
    eventBus.publish(ActionsEventEnum.MemberList)
  }
  // 添加成员
  addMember() {
    eventBus.publish(ActionsEventEnum.MemberAdd)
  }
  // 删除成员
  deleteMember() {
    eventBus.publish(ActionsEventEnum.MemberDelete)
  }
  // 编辑成员
  editMember() {
    eventBus.publish(ActionsEventEnum.MemberEdit)
  }
  // 添加角色
  addRole() {
    eventBus.publish(ActionsEventEnum.RoleAdd)
  }
  // 删除角色
  deleteRole() {
    eventBus.publish(ActionsEventEnum.RoleDelete)
  }
  // 编辑角色
  editRole() {
    eventBus.publish(ActionsEventEnum.RoleEdit)
  }
  // 角色列表
  roles() {
    eventBus.publish(ActionsEventEnum.RoleList)
  }
  // 创建频道
  createChannel() {
    eventBus.publish(ActionsEventEnum.ChannelCreate)
  }
  // 删除频道
  deleteChannel() {
    eventBus.publish(ActionsEventEnum.ChannelDelete)
  }
  // 编辑频道
  editChannel() {
    eventBus.publish(ActionsEventEnum.ChannelEdit)
  }
  // 频道列表
  channels() {
    eventBus.publish(ActionsEventEnum.ChannelList)
  }
  // 创建频道分类
  createCategory() {
    eventBus.publish(ActionsEventEnum.CategoryCreate)
  }
  // 删除频道分类
  deleteCategory() {
    eventBus.publish(ActionsEventEnum.CategoryDelete)
  }
  // 编辑频道分类
  editCategory() {
    eventBus.publish(ActionsEventEnum.CategoryEdit)
  }
  // 频道分类列表
  categories() {
    eventBus.publish(ActionsEventEnum.CategoryList)
  }
  // 踢出
  kickOut() {
    eventBus.publish(ActionsEventEnum.MemberKickOut)
  }
  // 禁言
  ban() {
    eventBus.publish(ActionsEventEnum.MemberBan)
  }
  // 解禁
  unban() {
    eventBus.publish(ActionsEventEnum.MemberUnban)
  }
}

/**
 *
 * @param event
 * @returns
 */
export const useActions = <T extends keyof Events>(event?: Events[T]) => {
  let current = event ?? {}
  const actions = new Actions()
  const setActions = (event?: Events[T]) => {
    const value = event ?? {}
    current = {
      ...current,
      ...value
    }
  }
  return [actions, setActions]
}

/**
 * 监听actions事件
 * @param ActionsEventEnum
 * @param callback
 */
export const onActions = (ActionsEventEnum: ActionsEventEnum, callback: any) => {
  eventBus.subscribe(ActionsEventEnum, callback)
}
