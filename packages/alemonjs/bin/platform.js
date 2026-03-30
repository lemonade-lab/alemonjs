#!/usr/bin/env node
import { join } from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import YAML from 'yaml';

const configPath = join(process.cwd(), 'alemon.config.yaml');

/**
 * 检测包管理器
 */
function detectPM() {
  if (fs.existsSync(join(process.cwd(), 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(join(process.cwd(), 'yarn.lock'))) return 'yarn';
  return 'npm';
}

/**
 * 读取配置
 */
function readConfig() {
  if (fs.existsSync(configPath)) {
    return YAML.parse(fs.readFileSync(configPath, 'utf8')) ?? {};
  }
  return {};
}

/**
 * 写入配置
 */
function writeConfig(config) {
  fs.writeFileSync(configPath, YAML.stringify(config));
}

/**
 * 添加平台
 * @param {string} name 平台名（如 discord, kook, qq-bot）
 */
export function platformAdd(name) {
  const pkgName = `@alemonjs/${name}`;
  const pm = detectPM();

  // 1. 检查是否已安装
  const pkgPath = join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error('未找到 package.json');
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  if (allDeps[pkgName]) {
    console.log(`${pkgName} 已安装 (${allDeps[pkgName]})`);
  } else {
    // 2. 安装
    console.log(`正在安装 ${pkgName}...`);
    try {
      const cmd = pm === 'npm' ? `npm install ${pkgName}` : pm === 'pnpm' ? `pnpm add ${pkgName}` : `yarn add ${pkgName}`;
      execSync(cmd, { stdio: 'inherit', timeout: 60000 });
      console.log(`✓ ${pkgName} 安装完成`);
    } catch {
      console.error(`✗ ${pkgName} 安装失败`);
      process.exit(1);
    }
  }

  // 3. 注册到配置
  const config = readConfig();
  if (!Array.isArray(config.platforms)) {
    config.platforms = [];
  }
  if (!config.platforms.includes(name)) {
    config.platforms.push(name);
    writeConfig(config);
    console.log(`✓ 已将 ${name} 添加到 alemon.config.yaml`);
  } else {
    console.log(`${name} 已在配置中`);
  }
}

/**
 * 移除平台
 * @param {string} name 平台名
 */
export function platformRemove(name) {
  const pkgName = `@alemonjs/${name}`;
  const pm = detectPM();

  // 1. 卸载包
  const pkgPath = join(process.cwd(), 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (allDeps[pkgName]) {
      console.log(`正在卸载 ${pkgName}...`);
      try {
        const cmd = pm === 'npm' ? `npm uninstall ${pkgName}` : pm === 'pnpm' ? `pnpm remove ${pkgName}` : `yarn remove ${pkgName}`;
        execSync(cmd, { stdio: 'inherit', timeout: 60000 });
        console.log(`✓ ${pkgName} 已卸载`);
      } catch {
        console.warn(`✗ ${pkgName} 卸载失败，请手动移除`);
      }
    } else {
      console.log(`${pkgName} 未安装，跳过卸载`);
    }
  }

  // 2. 从配置中移除
  const config = readConfig();
  if (Array.isArray(config.platforms)) {
    const idx = config.platforms.indexOf(name);
    if (idx !== -1) {
      config.platforms.splice(idx, 1);
      writeConfig(config);
      console.log(`✓ 已从 alemon.config.yaml 移除 ${name}`);
    }
  }
}

/**
 * 列出已安装平台
 */
export function platformList() {
  const pkgPath = join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error('未找到 package.json');
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const installed = Object.keys(allDeps).filter(n => n.startsWith('@alemonjs/'));

  const config = readConfig();
  const configured = Array.isArray(config.platforms) ? config.platforms : [];

  console.log('=== 平台列表 ===\n');

  if (installed.length === 0) {
    console.log('未安装任何 @alemonjs/* 平台包');
    return;
  }

  for (const name of installed) {
    const short = name.replace('@alemonjs/', '');
    const inConfig = configured.includes(short);
    const ver = allDeps[name];
    console.log(`  ${inConfig ? '●' : '○'} ${short} (${ver})${inConfig ? '' : ' [未注册到配置]'}`);
  }
}
