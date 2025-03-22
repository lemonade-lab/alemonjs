// import { ActionsEventEnum, DataEnums, EventKeys, Events } from '../typings'
// import { ActionsBus } from './store'

// class ActionMessage<T extends EventKeys> {
//   #event: Events[T]
//   #bus: ActionsBus
//   constructor(event?: Events[T]) {
//     this.#event = event
//     this.#bus = new ActionsBus()
//   }

//   // 创建
//   create(data: DataEnums[], _callback?: (res: {
//     delete: (time?: number) => void
//   }) => void) {
//     this.#bus.publish(ActionsEventEnum.MessageCreate, this.#event, data)
//   }

//   // 删除
//   delete(_time?: number) {
//     if (_time) {
//       setTimeout(() => {
//         this.#bus.publish(ActionsEventEnum.MessageDelete, this.#event)
//       }, _time)
//     } else {
//       this.#bus.publish(ActionsEventEnum.MessageDelete, this.#event)
//     }
//   }
// }
// /**
//  * 自定义 Hook，用于根据事件和控制函数返回相应的动作
//  * @param event 事件类型
//  * @param control 控制函数，用于选择动作
//  * @returns 返回相应的动作
//  */
// export const useActions = <T extends EventKeys>(event: Events[T]): [
//   {
//     message: ActionMessage<T>
//   },
//   (event: Events[T]) => void
// ] => {
//   const action = {
//     message: new ActionMessage(event)
//   }
//   const setEvent = (event: Events[T]) => {
//     action.message = new ActionMessage(event)
//   }
//   return [action, setEvent]
// }
export {}
