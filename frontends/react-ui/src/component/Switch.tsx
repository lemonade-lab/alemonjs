import { Switch as AntdSwitch } from 'antd';
import type { SwitchProps as AntdSwitchProps } from 'antd/es/switch';

/** `hover` 为旧版遗留字段；antd 会自行处理悬停状态。 */
export type ToggleSwitchProps = AntdSwitchProps & {
  hover?: boolean;
};

export function Switch({ hover: _hover, ...props }: ToggleSwitchProps) {
  return <AntdSwitch {...props} />;
}
