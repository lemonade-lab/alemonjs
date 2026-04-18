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
  };
};

export type DataButtonRow = {
  type: 'ButtonRow' | 'BT.row';
  value: DataButton[];
};

export type DataButtonGroup = {
  type: 'ButtonGroup' | 'BT.group';
  value: DataButtonRow[];
};
