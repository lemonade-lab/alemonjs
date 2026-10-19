#!/usr/bin/env node
import { join } from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

/**
 * 检查并更新 alemonjs 相关包到最新版本
 */
export async function versionUpdate() {
  const pkgPath = join(process.cwd(), 'package.json');

  if (!fs.existsSync(pkgPath)) {
    console.error('未找到 package.json');
    process.exit(1);
  }

  const raw = fs.readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(raw);

  const depFields = ['dependencies', 'devDependencies'];
  const matched = [];

  for (const field of depFields) {
    const deps = pkg[field];
    if (!deps) continue;
    for (const name of Object.keys(deps)) {
      if (name === 'alemonjs' || name.startsWith('@alemonjs/')) {
        matched.push({ field, name, current: deps[name] });
      }
    }
  }

  if (matched.length === 0) {
    console.log('未找到 alemonjs 或 @alemonjs/* 相关依赖');
    return;
  }

  console.log(`找到 ${matched.length} 个相关包，正在查询最新版本...\n`);

  let updated = 0;

  for (const item of matched) {
    try {
      const latest = execSync(`npm view ${item.name} version`, {
        encoding: 'utf8',
        timeout: 15000
      }).trim();

      const currentClean = item.current.replace(/^[\^~>=<]*/, '');

      if (currentClean === latest) {
        console.log(`  ✓ ${item.name} 已是最新 (${latest})`);
      } else {
        const prefix = item.current.match(/^([\^~]?)/)?.[1] ?? '^';
        pkg[item.field][item.name] = `${prefix}${latest}`;
        console.log(`  ↑ ${item.name} ${item.current} → ${prefix}${latest}`);
        updated++;
      }
    } catch {
      console.warn(`  ✗ ${item.name} 查询失败，跳过`);
    }
  }

  if (updated > 0) {
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`\n已更新 ${updated} 个包，请执行 npm install 安装最新版本`);
  } else {
    console.log('\n所有包均为最新版本');
  }
}
