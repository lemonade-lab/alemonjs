import React from 'react';
import { Dropdown as AntdDropdown } from 'antd';
import type { DropdownProps as AntdDropdownProps, MenuProps } from 'antd';
import { Button } from './Button';
import type { ButtonProps } from './Button';

/**
 * `buttons` 是旧版 API 的兼容层。新代码应优先使用 antd 的 `menu` 属性，
 * 以获得子菜单、分组、快捷键与受控开关等完整能力。
 */
export type DropdownProps = Omit<AntdDropdownProps, 'children' | 'menu'> & {
  buttons?: ButtonProps[];
  children: React.ReactNode;
  menu?: AntdDropdownProps['menu'];
};

function legacyButtonsToMenu(buttons: ButtonProps[]): MenuProps {
  return {
    selectable: false,
    items: buttons.map(({ children, ...button }, index) => ({
      key: `legacy-button-${index}`,
      disabled: button.disabled,
      label: <Button {...button}>{children}</Button>
    }))
  };
}

export function Dropdown({ buttons, children, menu, trigger, ...props }: DropdownProps) {
  const legacyMenu = buttons ? legacyButtonsToMenu(buttons) : undefined;
  const popupMenu = menu ?? legacyMenu;
  const popupTrigger = React.isValidElement(children) ? children : <span>{children}</span>;

  return (
    <AntdDropdown {...props} menu={popupMenu} trigger={trigger ?? (buttons ? ['click'] : undefined)}>
      {popupTrigger}
    </AntdDropdown>
  );
}
