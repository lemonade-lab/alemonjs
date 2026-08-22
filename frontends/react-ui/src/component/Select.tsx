import { Select as AntdSelect } from 'antd';
import type { BaseOptionType, DefaultOptionType, SelectProps as AntdSelectProps } from 'antd/es/select';

/**
 * Ant Design 的 Select，直接暴露其完整能力（搜索、多选、异步选项、键盘导航等）。
 *
 * 该组件不再是原生 `<select>` 的样式封装；请使用 antd 的 `options` 属性或
 * `<Select.Option />` 来传递选项。
 */
export type SelectProps<ValueType = unknown, OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType> = AntdSelectProps<
  ValueType,
  OptionType
>;

export const Select = AntdSelect;
