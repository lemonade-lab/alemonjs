# [https://alemonjs.com/](https://alemonjs.com/)

带有符合 alemonjs css 变量的组件库

## USE

```sh
yarn add @alemonjs/react
```

```ts
import { Button } from '@alemonjs/react';
```

## antd 组件迁移

`Select` 与 `Dropdown` 已使用 Ant Design 实现，并透传 antd 对应组件的属性。
`Select` 不再接收原生 `<option>`，请改用 `options` 或 `<Select.Option />`；
`Dropdown` 的新代码请使用 antd 的 `menu` 属性。旧版 `buttons` 参数暂时保留兼容。

`Tooltip`、`Collapse` 和 `Switch` 也已迁移到 antd。`Tooltip` 的旧版
`text`、`position`、`delay` 参数仍可使用；新增代码请分别使用 `title`、
`placement`、`mouseEnterDelay`。`Collapse` 保持默认单面板展开，设置
`accordion={false}` 可启用多面板；`Switch` 的 `hover` 参数已废弃。
