#!/usr/bin/env node
import { join } from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import YAML from 'yaml';

/**
 * 输出项目诊断信息
 */
export function info() {
  console.log('=== AlemonJS 项目信息 ===\n');

  // Node 版本
  console.log(`Node.js:  ${process.version}`);
  console.log(`Platform: ${process.platform} ${process.arch}`);

  // package.json
  const pkgPath = join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.log('\n未找到 package.json');
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  console.log(`项目名:   ${pkg.name || '-'}`);
  console.log(`版本:     ${pkg.version || '-'}`);

  // alemonjs 相关依赖
  const depFields = ['dependencies', 'devDependencies'];
  const related = [];
  for (const field of depFields) {
    const deps = pkg[field];
    if (!deps) continue;
    for (const [name, ver] of Object.entries(deps)) {
      if (name === 'alemonjs' || name.startsWith('@alemonjs/')) {
        related.push({ name, ver, dev: field === 'devDependencies' });
      }
    }
  }

  console.log(`\n--- 已安装平台/依赖 (${related.length}) ---`);
  if (related.length === 0) {
    console.log('  无');
  } else {
    for (const item of related) {
      const tag = item.dev ? ' (dev)' : '';
      console.log(`  ${item.name}@${item.ver}${tag}`);
    }
  }

  // alemon.config.yaml 摘要
  const configPath = join(process.cwd(), 'alemon.config.yaml');
  if (fs.existsSync(configPath)) {
    const config = YAML.parse(fs.readFileSync(configPath, 'utf8')) ?? {};
    const keys = Object.keys(config);
    console.log(`\n--- 配置摘要 (alemon.config.yaml) ---`);
    if (keys.length === 0) {
      console.log('  空配置');
    } else {
      for (const key of keys) {
        const val = config[key];
        if (Array.isArray(val)) {
          console.log(`  ${key}: [${val.join(', ')}]`);
        } else if (typeof val === 'object' && val !== null) {
          console.log(`  ${key}: { ${Object.keys(val).join(', ')} }`);
        } else {
          console.log(`  ${key}: ${val}`);
        }
      }
    }
  } else {
    console.log('\n未找到 alemon.config.yaml');
  }

  // .env 检查
  const envPath = join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envKeys = envContent
      .split('\n')
      .filter(l => l.trim() && !l.trim().startsWith('#'))
      .map(l => l.split('=')[0].trim())
      .filter(Boolean);
    console.log(`\n--- 环境变量 (.env) ---`);
    console.log(`  已配置 ${envKeys.length} 个变量: ${envKeys.join(', ')}`);
  }

  // 包管理器
  let pm = 'npm';
  if (fs.existsSync(join(process.cwd(), 'pnpm-lock.yaml'))) pm = 'pnpm';
  else if (fs.existsSync(join(process.cwd(), 'yarn.lock'))) pm = 'yarn';
  console.log(`\n包管理器: ${pm}`);
}
