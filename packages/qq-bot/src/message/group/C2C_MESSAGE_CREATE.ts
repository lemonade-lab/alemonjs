export type C2C_MESSAGE_CREATE_TYPE = {
  attachments?: {
    id?: string;
    url?: string;
    content_type?: string;
    filename?: string;
    size?: number;
  }[];
  author: {
    id: string;
    user_openid: string;
    username: string;
  };
  content: string;
  id: string;
  timestamp: string;
};
