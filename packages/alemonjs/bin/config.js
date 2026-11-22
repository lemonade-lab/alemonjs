import { readFileSync } from 'node:fs';
import YAML from 'yaml';

export async function inspectConfig({ file, platform, botId, channelId, private: isPrivate, app, mentioned, interaction }) {
  try {
    const { validateAccessConfig, evaluateAccess } = await import('../lib/common/access-policy.js');
    const config = YAML.parse(readFileSync(file, 'utf8')) ?? {};
    validateAccessConfig(config);
    if (!platform) {
      console.log(`配置检查通过：${file}`);
      return;
    }
    if (Boolean(channelId) === Boolean(isPrivate)) {
      throw new Error('请指定 --channel-id 或 --private，二选一');
    }
    const target = { platform, botId, channelId, scope: isPrivate ? 'private' : 'channel' };
    const inspect = name => evaluateAccess(config, target, name, !mentioned && !interaction);
    const configuredApps = Array.isArray(config.apps) ? config.apps : Object.keys(config.apps ?? {});
    const names = app ? [app] : [...new Set(['main', ...configuredApps.filter(name => typeof name === 'string')])];
    console.log(JSON.stringify({ framework: inspect(), apps: Object.fromEntries(names.map(name => [name, inspect(name)])) }, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
