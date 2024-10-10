interface Message {
  type: 'text'
  data: object // Replace 'object' with a more specific type if known
}

interface Sender {
  user_id: number
  nickname: string
  card: string
  role: 'admin' | 'member' | 'guest' // Adjust roles as necessary
}

interface MessageData {
  self_id: number
  user_id: number
  time: number
  message_id: number
  message_seq: number
  real_id: number
  message_type: 'group'
  sender: Sender
  raw_message: string
  font: number
  sub_type: 'normal'
  message: Message[]
  message_format: 'array'
  post_type: 'message'
  group_id: number
}
interface ImageMessageData {
  file: string
  sub_type: number
  file_id: string
  url: string
  file_size: number
  file_unique: string
}

interface Sender {
  user_id: number
  nickname: string
  card: string
  role: 'admin' | 'member' | 'guest' // Adjust roles as necessary
}

interface MessageData {
  self_id: number
  user_id: number
  time: number
  message_id: number
  message_seq: number
  real_id: number
  message_type: 'group'
  sender: Sender
  raw_message: string
  font: number
  sub_type: 'normal'
  message: Message[]
  message_format: 'array'
  post_type: 'message'
  group_id: number
}
