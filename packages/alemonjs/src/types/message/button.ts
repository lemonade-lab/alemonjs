export type DataButton = {
  type: 'Button';
  // 显示的文字
  value: string;
  options?: {
    // 禁用时提示
    toolTip?: string;
    // 自动回车
    autoEnter?: boolean;
    // 数据
    data?: string;
    // 按钮类型，默认 command
    type?: 'command' | 'link' | 'call';
    // 是否自动确认，默认 false - 即自动提交
    notAutoConfirmation?: boolean;
    // 是否引用回复
    reply?: boolean;
    // 权限
    permission?: {
      type?: number;
      userIds?: string[];
      roleIds?: string[];
    };
    // 风格
    style?: 'gray' | 'blue' | 'purple' | string;
    // 原始数据。直接透传
    rawData: {
      [key: string]: any;
    };
    // ═══ 平台扩展字段（QQ-Bot 等平台支持）═══
    /**
     * 按钮点击后弹出确认框（QQ-Bot 的 action.modal）
     * content 弹窗文案 / confirmText 确认按钮 / cancelText 取消按钮
     */
    modal?: {
      content?: string;
      confirmText?: string;
      cancelText?: string;
    };
    /**
     * 唤起选图器（QQ-Bot 指令按钮，仅单聊场景客户端支持）
     */
    anchor?: number;
    /**
     * 可操作点击次数限制（QQ-Bot，默认不限）
     */
    clickLimit?: number;
    /**
     * 指令按钮点击后弹出子频道选择器（QQ-Bot）
     */
    atBotShowChannelList?: boolean;
  };
};

export type DataButtonRow = {
  type: 'ButtonRow' | 'BT.row';
  value: DataButton[];
};

export type DataButtonGroup = {
  type: 'ButtonGroup' | 'BT.group';
  value: DataButtonRow[];
  options?: {
    /**
     * 小按钮样式：整个键盘使用小号按钮（QQ-Bot keyboard.content.style）
     */
    smallButton?: boolean;
    /**
     * 键盘级原始字段透传（如 style 等，直接并入 keyboard.content）
     */
    rawData?: Record<string, any>;
  };
};
