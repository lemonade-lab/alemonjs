export type DataSelectOption = {
  // 显示的文本
  label: string;
  // 选中后的值
  value: string;
  // 附加描述
  description?: string;
  // 表情/图标（字符串，平台自行解析）
  emoji?: string;
  // 是否默认选中
  default?: boolean;
};

/**
 * 选择组件（下拉菜单）
 * 跨平台通用：
 * - Discord: String/User/Role/Channel/Mentionable Select
 * - KOOK/QQ: 可降级为按钮组
 */
export type DataSelect = {
  type: 'Select';
  value: DataSelectOption[];
  options?: {
    // 组件 id
    customId?: string;
    // 占位提示
    placeholder?: string;
    // 最少选择
    minValues?: number;
    // 最多选择
    maxValues?: number;
    // 选择种类
    kind?: 'string' | 'user' | 'role' | 'channel' | 'mentionable';
    // 禁用
    disabled?: boolean;
  };
};
