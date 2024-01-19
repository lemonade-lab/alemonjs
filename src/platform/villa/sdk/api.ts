import axios, { type AxiosRequestConfig } from 'axios'
import FormData from 'form-data'
import { createHash } from 'crypto'
import { Readable } from 'stream'
import {
  ApiEnum,
  type MHYEnum,
  type MemberDataType,
  type MemberType,
  type VillaType,
  type MemberListType,
  type BotReplyMessageType,
  type Group,
  type GroupRoom,
  type RoomMsg,
  type ColorEnum,
  type MemberRolePermissionEnum,
  type Emoticon,
  type MemberRoleList,
  StringifyType,
  EntitiesType,
  ButtonType,
  PanelType
} from './types.js'
import { createPicFrom } from '../../../core/index.js'
import { config } from './config.js'
import { ApiLog } from './log.js'

class ClientVilla {
  /**
   * 别野服务
   * @param villa_id 别野编号
   * @param config 配置
   * @returns
   */
  async villaService(opstion: AxiosRequestConfig) {
    const bot_id = config.get('bot_id')
    const bot_secret = config.get('bot_secret')
    const service = axios.create({
      baseURL: 'https://bbs-api.miyoushe.com', // 地址
      timeout: 6000, // 响应
      headers: {
        'x-rpc-bot_id': bot_id, // 账号
        'x-rpc-bot_secret': bot_secret // 密码
      }
    })
    return await service(opstion)
  }

  /**
   * 图片转存
   * @param villa_id
   * @param url
   * @returns
   * type = villa
   */
  async transferImage(
    villa_id: number | string,
    url: string
  ): Promise<{
    data: {
      new_url: string
    }
  }> {
    return await this.villaService({
      method: 'post',
      url: ApiEnum.transferImage,
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      data: {
        url
      }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 得到请参数
   * @param villa_id
   * @param md5
   * @param ext
   * @returns
   */
  async getImageReq(villa_id: number | string, md5: string, ext: string) {
    return await this.villaService({
      method: 'get',
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      params: {
        md5: md5,
        ext: ext
      },
      url: ApiEnum.localImage
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 上传图片
   * @param villa_id
   * @param img
   * @param ImgName
   * @returns
   */
  async uploadImage(
    villa_id: number | string,
    img: string | Buffer | Readable,
    ImgName = 'image.jpg'
  ) {
    // 识别文件
    const from = await createPicFrom(img, ImgName)
    if (!from) return { data: null, message: '文件创建失败' }
    const { picData, image, name } = from
    const typing = name.split('.')[1] ?? 'jpg'
    const md5Hash = createHash('md5').update(image).digest('hex')
    const uploadParams = await this.getImageReq(villa_id, md5Hash, typing)
    const data = uploadParams.data
    if (!data) return uploadParams
    const formData = new FormData()
    formData.append('x:extra', String(data.params.callback_var['x:extra']))
    formData.append('OSSAccessKeyId', data.params.accessid)
    formData.append('signature', data.params.signature)
    formData.append('success_action_status', data.params.success_action_status)
    formData.append('name', data.params.name)
    formData.append('callback', data.params.callback)
    formData.append('x-oss-content-type', data.params.x_oss_content_type)
    formData.append('key', data.params.key)
    formData.append('policy', data.params.policy)
    formData.append('file', picData, name)
    return axios({
      url: data.params.host,
      method: 'post',
      data: formData
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * ******
   * 鉴权api
   * ******
   */
  /**
   * 校验用户机器人访问凭证
   * @param villa_id 别野
   * @param token 令牌
   * @returns
   * type = villa
   */
  async checkMemberBotAccessToken(
    villa_id: number | string,
    token: string
  ): Promise<{
    data: MemberDataType
  }> {
    return await this.villaService({
      method: 'post',
      url: ApiEnum.checkMemberBotAccessToken,
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      data: {
        token
      }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * ******
   * 大别野api
   * ******
   */

  /**
   * 获取大别野信息
   * @param villa_id  别野编号
   * @returns
   * type = villa
   */
  async getVilla(villa_id: number | string): Promise<{
    data: {
      villa: VillaType
    }
  }> {
    return await this.villaService({
      method: 'get',
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      url: ApiEnum.getVilla
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 已测
   * 获取大别野成员列表
   * @param villa_id  别野编号
   * @param offset_str  起始位置偏移量
   * @param size 分页大小
   * @returns
   * type = villa_id
   */
  async getVillaMembers(
    villa_id: number | string,
    offset_str: string,
    size: number
  ): Promise<{
    data: {
      list: MemberListType
    }
  }> {
    return await this.villaService({
      method: 'get',
      url: ApiEnum.getVillaMembers,
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      params: {
        offset_str,
        size
      }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * ******
   * 用户api
   * ******
   */
  /**
   * 已测
   * 获取用户信息
   * @param villa_id 别野
   * @param uid 用户编号
   * @returns
   * type = user
   */
  async getMember(
    villa_id: number | string,
    uid: string | number
  ): Promise<{
    data: {
      member: MemberType
    }
  }> {
    return await this.villaService({
      method: 'get',
      url: ApiEnum.getMember,
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      params: {
        uid: String(uid)
      }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * ??
   * 踢出大别野用户
   * @param villa_id 别野编号
   * @param uid 用户编号
   * @returns
   * type = user
   */
  async deleteVillaMember(villa_id: number | string, uid: string | number) {
    return await this.villaService({
      method: 'post',
      url: ApiEnum.deleteVillaMember,
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      data: {
        uid: String(uid)
      }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * *******
   * 消息api
   * *******
   */

  /**
   * 已测
   * 发送消息
   * @param villa_id 别野编号
   * @param data 配置数据
   * @returns
   * type = room_id
   */
  async sendMessage(
    villa_id: number | string,
    data: {
      room_id: number | string
      object_name: (typeof MHYEnum)[number]
      msg_content: string
    }
  ): Promise<{
    data: BotReplyMessageType
  }> {
    return await this.villaService({
      method: 'post',
      url: ApiEnum.sendMessage,
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      data: {
        room_id: Number(data.room_id),
        object_name: data.object_name,
        msg_content: data.msg_content
      }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 模板消息
   * @param villa_id
   * @param panel  消息组件面板json序列化后得到的字符串
   * @returns
   */
  async sendCard(
    villa_id: string | number,
    room_id: string | number,
    content: StringifyType
  ) {
    return await this.sendMessage(villa_id, {
      room_id,
      object_name: 'MHY:Text',
      msg_content: JSON.stringify(content)
    })
  }

  /**
   * 模板消息
   * @param villa_id
   * @param panel  消息组件面板json序列化后得到的字符串
   * @returns
   */
  async createComponentTemplate(villa_id: string | number, panel: any) {
    return await this.villaService({
      method: 'post',
      url: ApiEnum.createComponentTemplate,
      headers: {
        'Content-Type': 'application/json',
        'x-rpc-bot_ts': `${new Date().getTime()}`,
        'x-rpc-bot_nonce': '34719f00-2f13-364c-f7a7-44ca30b4f20e',
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      data: {
        panel: JSON.stringify(panel)
      }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * ??
   * 置顶消息
   * @param villa_id 别野编号
   * @param data 配置数据
   * @returns
   * type = message
   */
  async pinMessage(
    villa_id: number | string,
    data: {
      msg_uid: string | number // 消息 id
      is_cancel: boolean // 是否取消置顶
      room_id: string | number // 房间 id
    }
  ) {
    const [msg_uid, send_at] = String(data.msg_uid).split('.')
    return await this.villaService({
      method: 'post',
      url: ApiEnum.pinMessage,
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      data: {
        msg_uid: String(msg_uid), // 消息 id
        is_cancel: data.is_cancel, // 是否取消置顶
        room_id: String(data.room_id), // 房间 id
        send_at: Number(send_at) // 发送时间
      }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 撤回消息
   * @param villa_id 别野编号
   * @param data 配置数据
   * @returns
   * type = message
   */
  async recallMessage(
    villa_id: number | string,
    data: {
      msg_uid: string | number // 消息 id
      room_id: string | number // 房间 id
    }
  ) {
    const [msg_uid, send_at] = String(data.msg_uid).split('.')
    return await this.villaService({
      method: 'post',
      url: ApiEnum.recallMessage,
      headers: {
        'Content-Type': 'application/json',
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      params: {
        room_id: Number(data.room_id), // 房间 id
        msg_uid: String(msg_uid), // 消息 id
        msg_time: Number(send_at) // 发送时间
      }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * ******
   * 房间api
   * ******
   */

  /**
   * 已测
   * 创建分组
   * @param villa_id 别野编号
   * @param group_name 分组名
   * @returns
   * type = group_id
   */
  async createGroup(
    villa_id: number | string,
    group_name: string
  ): Promise<{
    data: {
      group_id: string
    }
  }> {
    return await this.villaService({
      method: 'post',
      url: ApiEnum.createGroup,
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      data: { group_name }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * ？？
   * 编辑分组
   * @param villa_id 别野编号
   * @param group_id 分组编号
   * @param group_name 分组名称
   * @returns
   * type = group_id
   */
  async editGroup(
    villa_id: number | string,
    group_id: number,
    group_name: string
  ) {
    return await this.villaService({
      method: 'post',
      url: ApiEnum.editGroup,
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      data: { group_id, group_name }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * ？？
   * 删除分组
   * @param villa_id 别野编号
   * @param group_id 分组编号
   * @returns
   * type = group_id
   */
  async deleteGroup(villa_id: number | string, group_id: number) {
    return await this.villaService({
      method: 'post',
      url: ApiEnum.deleteGroup,
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      data: { group_id }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 已测
   * 获取分组列表
   * @param villa_id 别野编号
   * @returns
   * type = villa
   */
  async getGroupList(villa_id: number | string): Promise<{
    data: {
      list: Group
    }
  }> {
    return await this.villaService({
      method: 'get',
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      url: ApiEnum.getGroupList
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * ??
   * 编辑房间
   * @param villa_id 别野编号
   * @param room_id 房间编号
   * @param room_name 房间名
   * @returns
   * type = room_id
   */
  async editRoom(
    villa_id: number | string,
    room_id: number | string,
    room_name: string | number
  ) {
    return await this.villaService({
      method: 'post',
      url: ApiEnum.editRoom,
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      data: {
        room_id: Number(room_id),
        room_name: String(room_name)
      }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * ??
   * 删除房间
   * @param villa_id 别野编号
   * @param room_id 房间编号
   * @returns
   * type = room_id
   */
  async deleteRoom(villa_id: number | string, room_id: number | string) {
    return await this.villaService({
      method: 'post',
      url: ApiEnum.deleteRoom,
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      data: {
        room_id: String(room_id)
      }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * 已测
   * 获取房间信息
   * @param villa_id 别野编号
   * @param room_id 房间编号
   * @returns
   * type = room_id
   */
  async getRoom(
    villa_id: number | string,
    room_id: number | string
  ): Promise<{
    data: {
      room: RoomMsg
    }
  }> {
    return await this.villaService({
      method: 'get',
      url: ApiEnum.getRoom,
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      params: {
        room_id: Number(room_id)
      }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * 已测
   * 获取房间列表信息
   * @param villa_id 别野编号
   * @returns
   * type = villa_id
   */
  async getVillaGroupRoomList(villa_id: number | string): Promise<{
    data: {
      list: GroupRoom
    }
  }> {
    return await this.villaService({
      method: 'get',
      url: ApiEnum.getVillaGroupRoomList,
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * ******
   * 身分组api
   * ******
   */
  /**
   * ??
   * 向身份组操作用户，包括把用户添加到身份组或者从身份组删除用户
   * @param villa_id 别野编号
   * @param data 配置数据
   * @returns
   * type = role_id
   */
  async operateMemberToRole(
    villa_id: number | string,
    data: {
      role_id: string //
      uid: string //
      is_add: boolean //
    }
  ) {
    return await this.villaService({
      method: 'post',
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      url: ApiEnum.operateMemberToRole,
      data
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 已測
   * 创建身份组
   * @param villa_id 别野编号
   * @param data 配置数据
   * @returns
   * type = villa_id
   */
  async createMemberRole(
    villa_id: number | string,
    data: {
      name: string
      color: Array<typeof ColorEnum>
      permissions: Array<typeof MemberRolePermissionEnum>
    }
  ): Promise<{
    data: {
      id: string
    }
  }> {
    return await this.villaService({
      method: 'post',
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      url: ApiEnum.createMemberRole,
      data
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }
  /**
   * ??
   * 编辑身份组
   * @param villa_id 别野编号
   * @param data 配置数据
   * @returns
   * type = villa_id
   */
  async editMemberRole(
    villa_id: number | string,
    data: {
      id: string
      name: string
      color: Array<typeof ColorEnum>
      permissions: Array<typeof MemberRolePermissionEnum>
    }
  ) {
    return await this.villaService({
      method: 'post',
      url: ApiEnum.editMemberRole,
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      data
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * ??
   * 删除身份组
   * @param villa_id 别野编号
   * @param id 身份组编号
   * @returns
   * type = id
   */
  async deleteMemberRole(villa_id: number | string, id: number) {
    return await this.villaService({
      method: 'post',
      url: ApiEnum.deleteMemberRole,
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      data: {
        id
      }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 已测
   * 获取大别野下所有身份组
   * @param villa_id 别野编号
   * @returns
   * type = villa_id
   */
  async getVillaMemberRoles(villa_id: number | string): Promise<{
    data: {
      list: MemberRoleList[]
    }
  }> {
    return await this.villaService({
      method: 'get',
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      url: ApiEnum.getVillaMemberRoles
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 获取身份组
   * @param villa_id 别野编号
   * @param role_id 身份组编号
   * @returns
   * type = role_id
   */
  async getMemberRoleInfo(villa_id: number | string, role_id: number) {
    return await this.villaService({
      method: 'get',
      url: ApiEnum.getMemberRoleInfo,
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      params: {
        role_id
      }
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * ******
   * 表态api
   * ******
   */

  /**
   * 获得平台所有表态表情列表
   * 表情在平台中从左到右排序
   * id从1开始
   * @param villa_id 别野编号
   * @returns
   */
  async getAllEmoticons(villa_id: number | string): Promise<{
    data: {
      list: Emoticon[]
    }
  }> {
    return await this.villaService({
      method: 'get',
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      url: ApiEnum.getAllEmoticons
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * ******
   * 审核api
   * ******
   */

  /**
   * 审核
   * @param villa_id 别野编号
   * @param data
   * @returns
   */
  async audit(
    villa_id: number | string,
    data: {
      audit_content: string // 待审核内容，必填
      pass_through?: string // 透传信息，该字段会在审核结果回调时携带给开发者，选填
      room_id?: number | string // 房间 id，选填
      uid: number // 用户 id, 必填
    }
  ): Promise<{
    data: { audit_id: string }
  }> {
    data.room_id = Number(data.room_id)
    return await this.villaService({
      method: 'post',
      headers: {
        'x-rpc-bot_villa_id': String(villa_id) // 别墅编号
      },
      url: ApiEnum.audit,
      data
    })
      .then(ApiLog)
      .catch(err => {
        console.error(err)
      })
  }

  /**
   * 自定义模块
   */

  /**
   * 字符串解析器
   * @param msg 消息
   * @param villa_id 别墅
   * @returns
   */
  async stringParsing(msg: string | string[], villa_id: number | string) {
    /**
     * 把string[]更改为string
     */
    let content = Array.isArray(msg)
      ? msg.join('')
      : typeof msg === 'string'
      ? msg
      : ''
    /**
     * 记录所有要渲染的
     */
    const num: any[] = []
    /**
     * 开始识别 @ 全体 并替换
     */
    content = content.replace(/<@(everyone)>/g, (match, id, offset) => {
      /**
       * 记录要渲染的名称和编号
       */
      num.push({
        id, // 得到id
        type: 0, // 得到类型
        name: '@全体成员 ' // 得到描述字
      })
      /**
       * 替换字样
       */
      return '@全体成员 '
    })

    /**
     * 识别外链
     */
    content = content.replace(
      /\[(.*?)\]\((.*?)\)/g,
      (match, id, url, offset) => {
        num.push({
          id,
          type: 3,
          url,
          name: `${id} `
        })
        return `${id} `
      }
    )

    /**
     * 开始识别 用户
     */
    const userArr: any[] = []
    /**
     * 知道艾特的位置
     */
    content.replace(/<@(\d+)>/g, (match, id, offset) => {
      userArr.push({
        id,
        offset
      })
      return match
    })
    /**
     * 正则匹配到
     */
    const userKeyVal = {}
    /**
     * 替换用户名
     * @param user_id
     * @param user_name
     */
    function setUserName(user_id: string, user_name: string) {
      /**
       * 替换字
       */
      content = content.replace(
        new RegExp(`<@${user_id}>`),
        (match, id, index) => {
          /**
           * 记录要渲染的名称和编号
           */
          num.push({
            id: user_id,
            type: 1,
            name: `@${user_name} `
          })
          /**
           * 记录
           */
          userKeyVal[user_id] = user_name
          /**
           * 替换为名字
           */
          return `@${user_name} `
        }
      )
    }
    /**
     *
     */
    for (const item of userArr) {
      /**
       * 存在
       */
      if (userKeyVal[item.id]) {
        setUserName(item.id, userKeyVal[item.id])
        continue
      }
      /**
       * 得到用户名
       */
      const User = await this.getMember(villa_id, item.id)
      if (User) {
        setUserName(item.id, User?.data?.member?.basic?.nickname)
      }
    }
    /**
     * 房间
     */
    const roomArr: any[] = []
    /**
     *
     */
    content.replace(/<#(\d+)>/g, (match, id, offset) => {
      /**
       *
       */
      roomArr.push({
        id,
        offset
      })
      /**
       *
       */
      return match
    })
    const roomKeyVal = {}
    /**
     * 替换房间名
     * @param room_id
     * @param room_name
     */
    function setRoomName(room_id: number, room_name: string) {
      content = content.replace(
        new RegExp(`<#${room_id}>`),
        (match, id, index) => {
          /**
           * 记录要渲染的名称和编号
           */
          num.push({
            id: room_id,
            type: 2,
            name: `#${room_name} `
          })
          roomKeyVal[room_id] = room_name
          return `#${room_name} `
        }
      )
    }
    /**
     *
     */
    for (const item of roomArr) {
      /**
       * 存在的key
       */
      if (roomKeyVal[item.id]) {
        setRoomName(item.id, roomKeyVal[item.id])
        continue
      }
      /**
       * 得到房间名
       */
      const Room = await this.getRoom(villa_id, item.id)
      if (Room) {
        setRoomName(item.id, Room.data.room.room_name)
        continue
      }
    }
    /**
     * 增加渲染
     */
    const entities: EntitiesType[] = []
    const matchedNames = {}
    for (const item of num) {
      /**
       * 如果该名称已经匹配过，则跳过
       */
      if (matchedNames[item.name]) {
        continue
      }
      matchedNames[item.name] = true
      /**
       * 构造正则
       */
      const regex = new RegExp(item.name, 'g')
      let match

      while ((match = regex.exec(content)) !== null) {
        const offset = match.index
        switch (item.type) {
          case 0: {
            entities.push({
              entity: {
                type: 'mentioned_all'
              },
              length: 6,
              offset
            })
            break
          }
          case 1: {
            entities.push({
              entity: {
                type: 'mentioned_user',
                user_id: item.id
              },
              length: item.name.length,
              offset
            })
            break
          }
          case 2: {
            entities.push({
              entity: {
                type: 'villa_room_link',
                villa_id: String(villa_id),
                room_id: item.id // 内容
              },
              length: item.name.length, // 长度
              offset
            })
            break
          }
          case 3: {
            entities.push({
              entity: {
                type: 'link', // 类型
                requires_bot_access_token: true, // 携带
                url: item.url ?? 'https://alemonjs.com' // 内容
              },
              length: item.name.length, // 长度
              offset
            })
            break
          }
          default: {
            break
          }
        }
      }
    }
    return {
      entities,
      content
    }
  }

  /**
   * 数据序列化
   * @param data
   * @returns
   */
  stringify(data: StringifyType) {
    return JSON.stringify(data)
  }

  /**
   * 消息发送
   * @param villa_id 别野
   * @param room_id 房间
   * @param m {msg:文本 images:{ url size }}
   * @param msg_id 消息编号
   * @returns
   */
  async replyMessage(
    villa_id: number | string,
    room_id: number | string,
    m: {
      msg?: string
      images?: {
        url: string
        width?: number
        height?: number
      }[]
      panel?: PanelType
    },
    msg_id?: string
  ) {
    const data = {
      content: undefined,
      panel: m?.panel,
      quote: undefined
    }
    let object_name: (typeof MHYEnum)[number] = 'MHY:Text'
    if (m?.msg || m?.images?.length > 1) {
      // 文字模式
      const { entities, content } = await this.stringParsing(m.msg, villa_id)
      data.content = {
        text: content,
        entities,
        images: m?.images ?? []
      }
    } else {
      // 图片模式
      data.content = {
        url: m.images[0].url,
        size:
          m.images[0]?.width && m.images[0]?.height
            ? {
                width: m.images[0]?.width,
                height: m.images[0]?.height
              }
            : undefined
      }
      object_name = 'MHY:Image'
    }
    if (msg_id) {
      const [id, at] = String(msg_id).split('.')
      data.quote = {
        original_message_id: id,
        original_message_send_time: Number(at),
        quoted_message_id: id,
        quoted_message_send_time: Number(at)
      }
    }
    return await this.sendMessage(villa_id, {
      room_id,
      object_name: object_name,
      msg_content: this.stringify(data)
    })
  }

  /**
   * Villa按钮自动排咧
   * @param arr
   * @returns
   */
  buttonAutomaticArrangement(arr: ButtonType[] = []) {
    const small = []
    const mid = []
    const big = []
    for (const item of arr) {
      if (!item.text?.length && item.text.length == 0) {
        continue
      }
      if (item.text.length <= 2) {
        small.push(item)
        continue
      }
      if (item.text.length <= 4) {
        mid.push(item)
        continue
      }
      if (item.text.length <= 10) {
        big.push(item)
        continue
      }
    }

    // 应该先按照数字大小分 三个类  再进行 分类中的小分区

    const small_component_group_list = []
    const mid_component_group_list = []
    const big_component_group_list = []

    let slist = []
    for (const item of small) {
      // 装进去
      if (slist.length < 3) {
        slist.push(item)
      } else {
        // 第三个进去
        small_component_group_list.push(slist)
        slist = []
        slist.push(item)
      }
    }

    // 如果是刚好三个
    if (slist.length == 3) {
      small_component_group_list.push(slist)
      slist = []
    }

    // 如果是 1 或 2 个  进入下一个批次
    for (const item of slist) {
      mid.push(item)
    }

    let mlist = []
    for (const item of mid) {
      if (mlist.length < 2) {
        mlist.push(item)
      } else {
        // 第二个进去
        mid_component_group_list.push(mlist)
        mlist = []
        mlist.push(item)
      }
    }

    // 如果是 2 进进入
    if (mlist.length == 2) {
      mid_component_group_list.push(mlist)
      mlist = []
    }

    // 所有的都排出来进入big
    for (const item of mlist) {
      big.push(item)
    }

    // 剩下所有big的直接单个格子
    for (const item of big) {
      big_component_group_list.push([item])
    }

    return {
      big_component_group_list: big_component_group_list, // 1
      mid_component_group_list: mid_component_group_list, // 2
      small_component_group_list: small_component_group_list // 3
    }
  }
}

export const ClientVILLA = new ClientVilla()
