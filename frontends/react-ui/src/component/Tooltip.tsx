import React from 'react';
import { Tooltip as AntdTooltip } from 'antd';
import type { TooltipProps as AntdTooltipProps } from 'antd/es/tooltip';

/**
 * `text`、`position` 与 `delay` 是旧版 API 的兼容字段。
 * 新代码请使用 antd 的 `title`、`placement` 与 `mouseEnterDelay`（单位为秒）。
 */
export type TooltipProps = AntdTooltipProps & {
  text?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: React.ReactNode;
};

export function Tooltip({ text, position, delay, title, placement, mouseEnterDelay, children, ...props }: TooltipProps) {
  const trigger = React.isValidElement(children) ? children : <span>{children}</span>;

  return (
    <AntdTooltip {...props} title={title ?? text} placement={placement ?? position ?? 'bottom'} mouseEnterDelay={mouseEnterDelay ?? (delay ?? 300) / 1000}>
      {trigger}
    </AntdTooltip>
  );
}
