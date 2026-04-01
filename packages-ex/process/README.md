# [https://alemonjs.com/](https://alemonjs.com/)

- 如何有效定义扩展 ？

```json
{
  "name": "@alemonjs/desktop",
  "type": "module",
  "version": "0.0.2",
  "description": "阿柠檬桌面交互协议",
  "main": "lib/index.js",
  "exports": {
    ".": "./lib/index.js",
    // 包配置信息（必须的）
    "./package": "./package.json",
    // 桌面扩展脚本
    "./desktop": "./desktop.js"
  }
}
```
