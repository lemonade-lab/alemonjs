export type DataButton = {
  type: 'Button';
  // 显示的文字
  value: string;
  options?: {
    // 禁止提示
    toolTip?: string;
    // 自动回车
    autoEnter?: boolean;
    // 数据
    data?: string;
    // isLink?: boolean
    type?: 'command' | 'link' | 'call';
  };
};

export type ButtonRow = {
  type: 'BT.row';
  value: DataButton[];
};

export type DataButtonGroup = {
  type: 'BT.group';
  value: ButtonRow[];
};

export type DataButtonTemplate = {
  type: 'ButtonTemplate';
  value: string;
};
