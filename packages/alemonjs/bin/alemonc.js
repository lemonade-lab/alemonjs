#!/usr/bin/env node
import { updateConfig } from './updateConfig.js';
import { run } from './run.js';
import { start } from './start.js';
import { versionUpdate } from './versionUpdate.js';
import { info } from './info.js';
import { platformAdd, platformRemove, platformList } from './platform.js';
import { login } from './login.js';
import { Command } from 'commander';
const program = new Command();

program.name('alemonc').description('CLI to some alemonc actions and scripts').version('1.0.0');

program
  .command('add <key> [values...]')
  .description('给key为数据的值添加元素')
  .action((key, values) => {
    updateConfig('add', key, values);
  });

program
  .command('remove <key> [values...]')
  .description('给key为数据的值移除元素')
  .action((key, values) => {
    updateConfig('remove', key, values);
  });

program
  .command('set <key> [values...]')
  .description('给某个key设置值')
  .action((key, values) => {
    updateConfig('set', key, values);
  });

program
  .command('del <key>')
  .description('删除指定配置')
  .action(key => {
    updateConfig('del', key);
  });

program
  .command('get <key>')
  .description('获取指定配置')
  .action(key => {
    updateConfig('get', key);
  });

program
  .command('run [script]')
  .description('运行指定脚本')
  .action(script => {
    run(script);
  });

program
  .command('start')
  .description('启动 package.json 中的 main 入口')
  .action(() => {
    start();
  });

program
  .command('version update')
  .description('检查并更新 alemonjs 和 @alemonjs/* 包到最新版本')
  .action(() => {
    versionUpdate();
  });

program
  .command('info')
  .description('输出项目诊断信息')
  .action(() => {
    info();
  });

const platformCmd = program.command('platform').description('平台管理');

platformCmd
  .command('add <name>')
  .description('安装并注册平台 (如 discord, kook, qq-bot)')
  .action(name => {
    platformAdd(name);
  });

platformCmd
  .command('remove <name>')
  .description('卸载并移除平台')
  .action(name => {
    platformRemove(name);
  });

platformCmd
  .command('list')
  .description('列出已安装的平台')
  .action(() => {
    platformList();
  });

program
  .command('login <platform>')
  .description('引导式配置平台 token (discord, kook, qq-bot, onebot, telegram)')
  .action(platform => {
    login(platform);
  });

program
  .command('help')
  .description('获取帮助')
  .action(() => {
    program.help();
  });

program.parse(process.argv);
