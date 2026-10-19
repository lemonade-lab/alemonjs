//#region src/types/message/button.d.ts
type DataButton = {
  type: 'Button';
  value: string;
  options?: {
    toolTip?: string;
    autoEnter?: boolean;
    data?: string;
    type?: 'command' | 'link' | 'call';
    notAutoConfirmation?: boolean;
    reply?: boolean;
    permission?: {
      type?: number;
      userIds?: string[];
      roleIds?: string[];
    };
    style?: 'gray' | 'blue' | 'purple' | string;
    rawData: {
      [key: string]: any;
    };
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
type DataButtonRow = {
  type: 'ButtonRow' | 'BT.row';
  value: DataButton[];
};
type DataButtonGroup = {
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
//#endregion
export { DataButton, DataButtonGroup, DataButtonRow };