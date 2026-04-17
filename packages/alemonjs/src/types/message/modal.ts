/**
 * 文本输入框（Modal 的子元素）
 */
export type DataTextInput = {
  type: 'TextInput';
  // label 文字
  value: string;
  options: {
    // 组件 id
    customId: string;
    // short=单行，paragraph=多行
    style?: 'short' | 'paragraph';
    // 占位
    placeholder?: string;
    // 最短
    minLength?: number;
    // 最长
    maxLength?: number;
    // 是否必填
    required?: boolean;
    // 预填值
    defaultValue?: string;
  };
};

/**
 * 弹窗表单
 * - Discord: Modal
 * - 其它平台: 降级为提示信息
 */
export type DataModal = {
  type: 'Modal';
  value: DataTextInput[];
  options: {
    // 表单 id
    customId: string;
    // 标题
    title: string;
  };
};
