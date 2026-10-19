//#region src/types/message/select.d.ts
type DataSelectOption = {
  label: string;
  value: string;
  description?: string;
  emoji?: string;
  default?: boolean;
};
/**
 * 选择组件（下拉菜单）
 * 跨平台通用：
 * - Discord: String/User/Role/Channel/Mentionable Select
 * - KOOK/QQ: 可降级为按钮组
 */
type DataSelect = {
  type: 'Select';
  value: DataSelectOption[];
  options?: {
    customId?: string;
    placeholder?: string;
    minValues?: number;
    maxValues?: number;
    kind?: 'string' | 'user' | 'role' | 'channel' | 'mentionable';
    disabled?: boolean;
  };
};
//#endregion
export { DataSelect, DataSelectOption };