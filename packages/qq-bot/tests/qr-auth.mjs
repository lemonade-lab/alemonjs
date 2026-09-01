/**
 * 扫码登录流程验证：
 * - 解密 AppSecret（AES-256-GCM 往返）
 * - 门户交互流程（等待→完成 / 过期刷新 / 创建失败）
 * - saveBotCredentials 写配置保留注释与原格式
 *
 * 运行：yarn workspace @alemonjs/qq-bot build && node tests/qr-auth.mjs
 */
import assert from 'node:assert/strict';
import { createCipheriv, randomBytes } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// 配置文件指向临时目录（getConfig 单例在首次调用时固化路径，须在触发保存前设置）
const configDir = mkdtempSync(join(tmpdir(), 'alemon-qr-test-'));
const configPath = join(configDir, 'alemon.config.yaml');
process.env.CFG_PATH = configPath;

const { qrLogin, decryptSecret, saveBotCredentials, buildConnectUrl } = await import('../lib/sdk/qr-auth.js');
const { QQBotRegistry } = await import('../lib/sdk/registry.js');
const { getConfigValue } = await import('alemonjs');

/** 与平台相同的加密结构：Base64(IV(12) + 密文 + AuthTag(16)) */
const encryptSecret = (plain, keyBase64) => {
  const key = Buffer.from(keyBase64, 'base64');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf-8'), cipher.final()]);

  return Buffer.concat([iv, ciphertext, cipher.getAuthTag()]).toString('base64');
};

// 0. A client that connects after QR emission can recover the retained challenge via connection.status.
{
  let actionHandler = null;
  const registry = new QQBotRegistry(
    undefined,
    {
      send() {},
      onactions(handler) {
        actionHandler = handler;
      },
      onapis() {}
    },
    () => ({
      state: 'awaiting_qrcode',
      type: 'qrcode',
      loginId: 'TASK_STATUS',
      qrcode: { url: 'https://example.test/qr', imageBase64: 'PNG', format: 'png' },
      updatedAt: 1
    })
  );
  assert.ok(registry);
  let results = null;
  await actionHandler({ action: 'connection.status', payload: {} }, value => {
    results = value;
  });
  assert.equal(results[0].data.login.loginId, 'TASK_STATUS');
  assert.equal(results[0].data.login.qrcode.url, 'https://example.test/qr');
}

// 1. 解密往返
{
  const key = randomBytes(32).toString('base64');
  assert.equal(decryptSecret(encryptSecret('my-app-secret', key), key), 'my-app-secret');
}

// 2. 授权链接
{
  const url = buildConnectUrl('TASK_X/1');
  assert.ok(url.includes('task_id=TASK_X%2F1'), 'task_id 需要编码');
  assert.ok(url.startsWith('https://q.qq.com/qqbot/openclaw/connect.html'));
  assert.ok(url.includes('source=alemonjs'), '来源标识应为 alemonjs');
}

// 3. 完整流程：等待两次后完成，密钥用本地 key 加密回传
{
  let pollCount = 0;
  let capturedQR = null;
  const statuses = [];
  const keys = [];

  const request = async (path, body) => {
    if (path === '/lite/create_bind_task') {
      keys.push(body.key);
      return { retcode: 0, data: { task_id: 'TASK_1' } };
    }
    pollCount++;
    if (pollCount < 3) {
      return { retcode: 0, data: { status: 1 } };
    }
    return {
      retcode: 0,
      data: {
        status: 2,
        bot_appid: '1234567890',
        user_openid: 'OPENID_X',
        bot_encrypt_secret: encryptSecret('SECRET_Y', keys[0])
      }
    };
  };

  const result = await qrLogin({
    pollInterval: 5,
    request,
    onQRCode: buffer => {
      capturedQR = buffer;
    },
    onStatus: message => {
      statuses.push(message);
    }
  });

  assert.deepEqual(
    { loginId: result.loginId, appId: result.appId, clientSecret: result.clientSecret, userOpenid: result.userOpenid },
    { loginId: 'TASK_1', appId: '1234567890', clientSecret: 'SECRET_Y', userOpenid: 'OPENID_X' }
  );
  assert.ok(capturedQR && capturedQR.length > 0, 'onQRCode 应收到二维码图片');
  assert.ok(capturedQR.subarray(0, 4).toString('hex') === '89504e47', '回调收到的图片应为 PNG');
  assert.ok(statuses.some(message => message.includes('扫码授权成功')));
}

// 4. 过期刷新：第一个二维码过期后第二个任务完成
{
  let taskIndex = 0;
  let pollCount = 0;
  const keys = [];

  const request = async (path, body) => {
    if (path === '/lite/create_bind_task') {
      keys.push(body.key);
      taskIndex++;
      return { retcode: 0, data: { task_id: `TASK_${taskIndex}` } };
    }
    pollCount++;
    if (taskIndex === 1) {
      return { retcode: 0, data: { status: 3 } };
    }
    assert.equal(body.task_id, 'TASK_2', '过期后应使用新任务轮询');
    return {
      retcode: 0,
      data: { status: 2, bot_appid: '987654321', user_openid: 'OPENID_Z', bot_encrypt_secret: encryptSecret('SEC_Z', keys[1]) }
    };
  };

  const result = await qrLogin({ pollInterval: 5, request });

  assert.equal(result.appId, '987654321');
  assert.equal(result.clientSecret, 'SEC_Z');
  assert.equal(taskIndex, 2, '二维码应刷新一次');
}

// 5. 创建任务失败：返回 null
{
  const result = await qrLogin({
    request: async () => ({ retcode: 50001, msg: 'invalid request' })
  });
  assert.equal(result, null);
}

// 6. 写配置：已有注释与格式保持不变
{
  writeFileSync(
    configPath,
    [
      '# 顶部注释：alemonjs 配置',
      'apps:',
      '  - aa # 行内注释',
      'qq-bot:',
      '  app_id: "" # 原有行内注释',
      '  secret: ""',
      '  markdownToText: true',
      'master_id:',
      '  - 10000'
    ].join('\n'),
    'utf-8'
  );

  assert.ok(saveBotCredentials('APP_1', 'SEC_1'), '保存应成功');

  const text = readFileSync(configPath, 'utf-8');

  assert.ok(text.includes('# 顶部注释：alemonjs 配置'), '顶部注释应保留');
  assert.ok(text.includes('# 行内注释'), '其他键的行内注释应保留');
  assert.ok(text.includes('markdownToText: true'), '既有键应保持不变');
  assert.ok(text.includes('  - 10000'), '列表格式应保持不变');

  const YAML = (await import('yaml')).default;
  const parsed = YAML.parse(text);
  assert.equal(parsed['qq-bot'].app_id, 'APP_1');
  assert.equal(parsed['qq-bot'].secret, 'SEC_1');
  assert.equal(parsed['qq-bot'].markdownToText, true);
  assert.deepEqual(parsed.apps, ['aa']);

  // 内存配置同步（reload）
  assert.equal(getConfigValue()['qq-bot'].app_id, 'APP_1', '保存后内存配置应同步');
}

// 7. 写配置：平台全名节存在时优先写入（@ 开头的键在 YAML 中必须加引号）
{
  writeFileSync(configPath, '"@alemonjs/qq-bot":\n  app_id: old\n  secret: old\n', 'utf-8');

  assert.ok(saveBotCredentials('APP_2', 'SEC_2'));

  const YAML = (await import('yaml')).default;
  const parsed = YAML.parse(readFileSync(configPath, 'utf-8'));
  assert.equal(parsed['@alemonjs/qq-bot'].app_id, 'APP_2');
  assert.equal(parsed['@alemonjs/qq-bot'].secret, 'SEC_2');
  assert.equal(parsed['qq-bot'], undefined, '不应新建 qq-bot 节');
}

// 8. 写配置：文件不存在时创建
{
  rmSync(configPath);
  assert.ok(!existsSync(configPath));
  assert.ok(saveBotCredentials('APP_3', 'SEC_3'));

  const YAML = (await import('yaml')).default;
  const parsed = YAML.parse(readFileSync(configPath, 'utf-8'));
  assert.equal(parsed['qq-bot'].app_id, 'APP_3');
  assert.equal(parsed['qq-bot'].secret, 'SEC_3');
}

rmSync(configDir, { recursive: true, force: true });
console.log('扫码登录流程验证通过（解密 / 流程 / 配置保注释写入）');
process.exit(0);
