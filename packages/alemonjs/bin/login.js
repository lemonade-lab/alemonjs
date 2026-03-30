#!/usr/bin/env node
import { join } from 'path';
import fs from 'fs';
import { createInterface } from 'readline';
import YAML from 'yaml';

const configPath = join(process.cwd(), 'alemon.config.yaml');

/**
 * 平台所需的配置字段定义
 */
const platformFields = {
  discord: [{ key: 'token', label: 'Bot Token', required: true, secret: true }],
  kook: [{ key: 'token', label: 'Bot Token', required: true, secret: true }],
  telegram: [
    { key: 'token', label: 'Bot Token (从 @BotFather 获取)', required: true, secret: true },
    { key: 'proxy', label: '代理地址 (可选, 如 http://127.0.0.1:7890)', required: false }
  ],
  'qq-bot': [
    { key: 'app_id', label: 'AppID', required: true },
    { key: 'token', label: 'Token', required: true, secret: true },
    { key: 'secret', label: 'AppSecret', required: true, secret: true }
  ],
  onebot: [
    { key: 'url', label: 'WebSocket 地址 (如 ws://127.0.0.1:6700)', required: true },
    { key: 'token', label: 'Access Token (可选)', required: false, secret: true }
  ]
};

/**
 * 提示输入
 */
function prompt(rl, question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

/**
 * 引导式登录配置
 * @param {string} name 平台名
 */
export async function login(name) {
  const fields = platformFields[name];
  if (!fields) {
    const supported = Object.keys(platformFields).join(', ');
    console.error(`不支持的平台: ${name}`);
    console.log(`支持的平台: ${supported}`);
    process.exit(1);
  }

  console.log(`\n=== 配置 ${name} 平台 ===\n`);

  // 读取现有配置
  let config = {};
  if (fs.existsSync(configPath)) {
    config = YAML.parse(fs.readFileSync(configPath, 'utf8')) ?? {};
  }
  const existing = config[name] || {};

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const result = { ...existing };

  for (const field of fields) {
    const current = existing[field.key];
    const mask = field.secret && current ? current.slice(0, 4) + '****' : current;
    const hint = current ? ` [当前: ${mask}, 回车保留]` : field.required ? '' : ' [可选, 回车跳过]';

    const answer = await prompt(rl, `${field.label}${hint}: `);

    if (answer) {
      result[field.key] = answer;
    } else if (!current && field.required) {
      console.error(`${field.label} 是必填项`);
      rl.close();
      process.exit(1);
    }
  }

  rl.close();

  // 写入配置
  config[name] = result;
  fs.writeFileSync(configPath, YAML.stringify(config));

  console.log(`\n✓ ${name} 配置已保存到 alemon.config.yaml`);
  console.log('  提示: 请确保 alemon.config.yaml 已加入 .gitignore，避免泄露密钥');
}
