#!/usr/bin/env node
import { updateConfig } from './updateConfig.js';
import { run } from './run.js';
import { start } from './start.js';
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
  .command('help')
  .description('获取帮助')
  .action(() => {
    program.help();
  });

program.parse(process.argv);
