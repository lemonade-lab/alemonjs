//  消息动作：撤回（删除）、重新编辑、引用、转发、置顶、取消置顶、表态、取消表态。
class MessageAction {
  #MessageId: string
  constructor(MessageId?: string) {
    this.#MessageId = MessageId
  }
  // 撤回
  recall() {
    //
  }
  // 重新编辑
  edit() {
    //
  }
  // 引用
  quote() {
    //
  }
  // 转发
  forward() {
    //
  }
  // 置顶
  top() {
    //
  }
  // 取消置顶
  untop() {
    //
  }
  // 表态
  like() {
    //
  }
  // 取消表态
  unlike() {
    //
  }
}

class Guild {
  // 创建公会
  create() {
    //
  }
  // 删除公会
  delete() {
    //
  }
  // 编辑公会
  edit() {
    //
  }
  // 退出公会
  quit() {
    //
  }
  // 加入公会
  join() {
    //
  }
}

class Member {
  // 成员列表
  members() {
    //
  }
  // 添加成员
  addMember() {
    //
  }
  // 删除成员
  deleteMember() {
    //
  }
  // 编辑成员
  editMember() {
    //
  }
}

class Action {
  // 添加角色
  addRole() {
    //
  }
  // 删除角色
  deleteRole() {
    //
  }
  // 编辑角色
  editRole() {
    //
  }
  // 角色列表
  roles() {
    //
  }
  // 创建频道
  createChannel() {
    //
  }
  // 删除频道
  deleteChannel() {
    //
  }
  // 编辑频道
  editChannel() {
    //
  }
  // 频道列表
  channels() {
    //
  }
  // 创建频道分类
  createCategory() {
    //
  }
  // 删除频道分类
  deleteCategory() {
    //
  }
  // 编辑频道分类
  editCategory() {
    //
  }
  // 频道分类列表
  categories() {
    //
  }
  // 踢出
  kickOut() {
    //
  }
  // 禁言
  ban() {
    //
  }
  // 解禁
  unban() {
    //
  }
}
