/**
 *
 * @param event
 */
export async function MESSAGE_BUTTON(event: {
  robot: {
    template: {
      id: string
      name: string
      desc: string
      icon: string
      commands: Array<{
        name: string // 指令
        desc: string // 指令说明
      }>
    }
    villa_id: number
  }
  type: number
  extend_data: {
    EventData: {
      DeleteRobot: {
        villa_id: number // 别野编号
      }
      CreateRobot: {
        villa_id: number // 别野编号
      }
    }
  }
  created_at: number
  id: string
  send_at: number
}) {
  const EventData = event.extend_data.EventData
}
