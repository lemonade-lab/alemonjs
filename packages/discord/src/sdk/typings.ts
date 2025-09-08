/**
 * buttons start
 */
type ComponentButton = {
  type: number;
  style: 2;
  label?: string;
  emoji?: any;
  custom_id?: string; // 非高级按钮所必要的
  sku_id?: any; // 和所有的互斥（高级按钮）
  url?: string; // 和 custom_id 互斥
  disabled?: boolean;
};

type ComponentButtons = {
  type: 1;
  components: ComponentButton[];
};

/**
 * buttons end
 */

/**
 * select start
 */
type ComponentSelectsOption = {
  label: string;
  value: string;
  description?: string;
  emoji?: {
    name?: string;
    id?: string;
  };
};

type ComponentChannelSelect = {
  type: 8;
  custom_id: string;
  placeholder?: string;
  channel_types?: number[];
};

type ComponentMentionSelect = {
  type: 7;
  custom_id: string;
  placeholder?: string;
};

type ComponentRuleSelect = {
  type: 6;
  custom_id: string;
  placeholder?: string;
  max_values?: number;
  min_values?: number;
};
type ComponentUserSelect = {
  type: 5;
  custom_id: string;
  placeholder?: string;
};
type ComponentSelect = {
  type: 3;
  custom_id: string;
  max_values?: number;
  min_values?: number;
  options: ComponentSelectsOption[];
};

type ComponentSelects = {
  type: 1;
  components: (ComponentSelect | ComponentUserSelect | ComponentRuleSelect | ComponentMentionSelect | ComponentChannelSelect)[];
};

/**
 * select end
 */

/**
 * input start
 */

type ComponentInput = {
  id?: number;
  type: 4;
  custom_id: string;
  label: string;
  style: number;
  min_length?: number;
  max_length?: number;
  placeholder?: string;
  required?: boolean;
};

type ComponentModal = {
  title: string;
  custom_id: string;
  components: {
    type: 1;
    components: ComponentInput[];
  }[];
};

/**
 * input end
 */

/**
 * section start
 */

type ComponentText = {
  type: 10;
  content: string;
};

type ComponentSection = {
  type: 9;
  components: ComponentText[];
  accessory?: {
    type: 11;
    media: {
      url: string;
    };
  };
};

/**
 * section end
 */

type ComponentMedia = {
  type: 12;
  items: {
    media: {
      url: string;
    };
    description?: string;
  }[];
};

type ComponentFile = {
  type: 13;
  file: {
    url: string;
  };
};

// 分隔符
type ComponentSeparator = {
  type: 14;
  divider: boolean;
  spacing: number;
};

// 组件容器
type ComponentContainer = {
  type: 17;
  accent_color: number;
  components: (ComponentButtons | ComponentSelects | ComponentMedia | ComponentFile | ComponentText | ComponentSection | ComponentSeparator)[];
};

// 发送消息时的最大请求大小为25 MiB
export type MessageData = {
  // 内容
  content?: string;
  // 是否是 tts
  tts?: boolean;
  /**
   * 嵌入
   */
  embeds?: {
    title?: string;
    type?: string;
    description?: string;
    url?: string;
    timestamp?: string;
    color?: number;
    footer?: {
      text: string;
      icon_url?: string;
      proxy_icon_url?: string;
    };
    image?: {
      url: string;
      proxy_url?: string;
      height?: number;
      width?: number;
    };
    thumbnail?: {
      url: string;
      proxy_url?: string;
      height?: number;
      width?: number;
    };
    video?: {
      url: string;
      proxy_url?: string;
      height?: number;
      width?: number;
    };
    provider?: {
      name: string;
      url: string;
    };
    author?: {
      name: string;
      url?: string;
      icon_url?: string;
      proxy_icon_url?: string;
    };
    fields?: {
      name: string;
      value: string;
      inline?: boolean;
    }[];
  }[];
  allowed_mentions?: any;
  message_reference?: any;
  /**
   * 组件
   */
  components?: (
    | ComponentButtons
    | ComponentSelects
    | ComponentModal
    | ComponentMedia
    | ComponentFile
    | ComponentText
    | ComponentSection
    | ComponentSeparator
    | ComponentContainer
  )[];
  sticker_ids?: any;
  files?: any[];
  payload_json?: string;
  attachments?: {
    id: string;
    filename: string;
    description?: string;
    content_type?: string;
    size: number;
    url: string;
    proxy_url?: string;
    height?: number;
    width?: number;
    ephemeral?: boolean;
    duration_secs?: number;
    waveform?: string;
    flags?: number;
  }[];
  flags?: number;
  enforce_nonce?: boolean;
  poll?: any;
};
