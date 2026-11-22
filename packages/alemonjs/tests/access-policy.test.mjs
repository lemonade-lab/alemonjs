import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { after } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Router, shutdownLogger } from 'alemonjs';
import { getConfig } from 'alemonjs/common';
import { createTestApp } from 'alemonjs/testing';
import YAML from 'yaml';

after(() => shutdownLogger());

const settings = {
  processor: { access: { deny: [{ platform: 'onebot', channelId: 'blocked' }] } },
  apps: { candidate: { access: { allow: [{ platform: 'onebot', botId: 'test-bot', channelId: '123' }] } }, other: true }
};

test('framework and app access applies to messages and buttons without crossing platforms or bot instances', async t => {
  const app = createTestApp({ config: settings });
  t.after(() => app.dispose());
  const calls = [];
  for (const name of ['candidate', 'other']) {
    const router = Router.create({ events: ['message.create', 'private.message.create', 'interaction.create'] });
    router.res({}, () => (_event, next) => {
      calls.push(name);
      next();
    });
    await app.mount({ responseRouter: router.define }, {}, name);
  }
  for (const [event, expected] of [
    [app.events.groupMessage({ platform: 'onebot', groupId: '123' }), ['candidate', 'other']],
    [app.events.channelMessage({ platform: 'discord', channelId: '123' }), ['other']],
    [app.events.groupMessage({ platform: 'onebot', groupId: '123', botId: 'other-bot' }), ['other']],
    [app.events.interaction({ platform: 'onebot', groupId: '123' }), ['candidate', 'other']],
    [app.events.interaction({ platform: 'onebot', groupId: 'blocked' }), []],
    [app.events.privateMessage({ platform: 'onebot' }), ['other']]
  ]) {
    calls.length = 0;
    await app.clock.advance(1000);
    await app.dispatch(event);
    assert.deepEqual(calls, expected);
  }
});

test('CLI reports matching rule paths and rejects invalid selectors', t => {
  const root = mkdtempSync(join(tmpdir(), 'alemon-config-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const path = join(root, 'alemon.config.yaml');
  const cli = fileURLToPath(new URL('../bin/alemonc.js', import.meta.url));
  const invoke = (...args) => execFileSync(process.execPath, [cli, 'config', ...args, '--file', path], { encoding: 'utf8' });
  writeFileSync(path, YAML.stringify(settings));
  assert.match(invoke('check'), /检查通过/);
  const diagnose = platform => JSON.parse(invoke('explain', '--platform', platform, '--bot-id', 'test-bot', '--channel-id', '123', '--app', 'candidate'));
  assert.equal(diagnose('onebot').apps.candidate.rule, 'apps.candidate.access.allow[0]');
  assert.equal(diagnose('discord').apps.candidate.allowed, false);
  execFileSync(process.execPath, [cli, 'add', 'apps', 'new-app'], { cwd: root });
  assert.deepEqual(YAML.parse(readFileSync(path, 'utf8')).apps.candidate.access, settings.apps.candidate.access);
  writeFileSync(path, 'processor:\n  access:\n    aloow: []\n');
  const result = spawnSync(process.execPath, [cli, 'config', 'check', '--file', path], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /processor\.access\.aloow/);
});

test('config watcher keeps the prior policy after an invalid edit and observes atomic replacement', async t => {
  const root = mkdtempSync(join(tmpdir(), 'alemon-config-reload-'));
  const path = join(root, 'alemon.config.yaml');
  const previousPath = process.env.CFG_PATH;
  const previousConfig = global.__config;
  process.env.CFG_PATH = path;
  delete global.__config;
  writeFileSync(path, YAML.stringify(settings));
  const config = getConfig();
  t.after(() => {
    config.dispose();
    if (previousPath === undefined) delete process.env.CFG_PATH;
    else process.env.CFG_PATH = previousPath;
    global.__config = previousConfig;
    rmSync(root, { recursive: true, force: true });
  });

  assert.deepEqual(config.value, settings);
  const replace = value => {
    writeFileSync(path + '.tmp', YAML.stringify(value));
    renameSync(path + '.tmp', path);
  };
  replace({ processor: { access: { deny: [{ channelID: '123' }] } } });
  config.reload();
  assert.deepEqual(config.value, settings);

  const next = { processor: { access: { allow: [] } } };
  const reloaded = new Promise(resolve => config.onWatch(resolve));
  replace(next);
  const received = await Promise.race([reloaded, new Promise((_, reject) => setTimeout(() => reject(new Error('Config watcher timed out')), 2000).unref())]);
  assert.deepEqual(received, next);
  assert.deepEqual(config.value, next);
});
