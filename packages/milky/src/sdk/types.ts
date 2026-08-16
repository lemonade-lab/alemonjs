export type MilkySegment = {
  type: string;
  data: Record<string, any>;
  [key: string]: any;
};

export type MilkyEvent = {
  time?: number;
  self_id: string | number;
  event_type: string;
  data?: any;
  [key: string]: any;
};

export type MilkyMessageEventData = {
  message_scene: 'friend' | 'group' | 'temp';
  peer_id: string | number;
  message_seq: string | number;
  sender_id: string | number;
  time: number;
  segments: MilkySegment[];
  friend?: any;
  group?: any;
  group_member?: any;
};
