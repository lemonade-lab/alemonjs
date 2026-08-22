import React from 'react';
import { Collapse as AntdCollapse } from 'antd';
import type { CollapseProps as AntdCollapseProps } from 'antd/es/collapse/Collapse';

export type CollapseProps = AntdCollapseProps;

/**
 * 默认保留旧组件的手风琴行为；传入 `accordion={false}` 可启用 antd 的多面板展开。
 */
const CollapseBase = React.forwardRef<HTMLDivElement, CollapseProps>(({ accordion = true, ...props }, ref) => (
  <AntdCollapse ref={ref} accordion={accordion} {...props} />
));

CollapseBase.displayName = 'Collapse';

export const Collapse = Object.assign(CollapseBase, { Panel: AntdCollapse.Panel });
