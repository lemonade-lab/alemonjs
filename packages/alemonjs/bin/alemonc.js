#!/usr/bin/env node
import { updateConfig } from './updateConfig.js';
import { run } from './run.js';
import { start } from './start.js';
import { versionUpdate } from './versionUpdate.js';
import { info } from './info.js';
import { platformAdd, platformRemove, platformList } from './platform.js';
import { login } from './login.js';
import { publish } from './publish.js';
import { branch } from './branch.js';
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
  .command('update')
  .description('检查并更新 alemonjs 和 @alemonjs/* 包到最新版本')
  .action(() => {
    versionUpdate();
  });

program
  .command('upgrade')
  .description('检查并更新 alemonjs 和 @alemonjs/* 包到最新版本')
  .action(() => {
    versionUpdate();
  });

program
  .command('branch <name>')
  .description('创建并切换到 dev-YYYYMMDD-<name> 分支，日期使用当天本地日期')
  .action(name => {
    try {
      branch(name);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('publish [release]')
  .description('按当前源码分支发布构建产物，主分支打 tag，其他分支只更新产物分支')
  .option('--preid <preid>', '预发布标识，仅允许 alpha/beta/rc/next', 'beta')
  .option('--branch <branch>', '覆盖产物目标分支，默认主分支为 release，其他为源码分支名（/ 替换为 -）加 -release；不改变打 tag 规则')
  .option('--dry-run', '只执行检查和打包，不真正发布')
  .option('--skip-build', '跳过构建')
  .option('--no-git-checks', '跳过 git 干净工作区检查及发布后自动提交源码版本')
  .action(async (release, options) => {
    try {
      await publish(release, options);
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    }
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

program.parseAsync(process.argv);
