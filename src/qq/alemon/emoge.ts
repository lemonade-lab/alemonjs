// e.replyCard = async (arr: CardType[]) => {
//   for (const item of arr) {
//     try {
//       if (item.type == 'qq_ark' || item.type == 'qq_embed') {
//         return await ClientQQ.messageApi
//           .postMessage(event.msg.channel_id, {
//             msg_id: event.msg.id,
//             ...item.card
//           })
//           .catch(everyoneError)
//       } else {
//         return false
//       }
//     } catch (err) {
//       return err
//     }
//   }
//   return true
// }

// /**
//  * 发送表情表态
//  * @param mid
//  * @param boj { emoji_type: number; emoji_id: string }
//  * @returns
//  */
// e.replyEmoji = async (
//   mid: string,
//   boj: { emoji_type: number; emoji_id: string }
// ): Promise<boolean> => {
//   return await ClientQQ.reactionApi
//     .postReaction(event.msg.channel_id, {
//       message_id: mid,
//       ...boj
//     })
//     .catch(everyoneError)
// }

// /**
//  * 删除表情表态
//  * @param mid
//  * @param boj { emoji_type: number; emoji_id: string }
//  * @returns
//  */
// e.deleteEmoji = async (
//   mid: string,
//   boj: { emoji_type: number; emoji_id: string }
// ): Promise<boolean> => {
//   return await ClientQQ.reactionApi
//     .deleteReaction(event.msg.channel_id, {
//       message_id: mid,
//       ...boj
//     })
//     .catch(everyoneError)
// }
