#!/usr/bin/env node

import { Command } from "commander";
const program = new Command();
// 版本号
program.version("1.0.0");
/**
 * 响应指令install
 */
program.command("install").action(async () => {
  await import("../commands/install.js");
});
/**
 * 响应指令i
 */
program.command("i").action(async () => {
  await import("../commands/install.js");
});
/**
 * 说明控制
 * @returns
 */
program.helpInformation = function () {
  return `
Options:
    -h, --help         display help for command
    -V, --version      output the version number

Commands:
    install    #初始化
    i          #初始化

Usage: 
$ alemon-cli [command] [options]

Examples:
$ alemon-cli install        # 创建启动模板
$ alemon-cli create         # 创建插件模板
`;
};
program.parse(process.argv);
