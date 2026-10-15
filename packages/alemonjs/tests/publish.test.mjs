import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { test } from 'node:test';

const publishUrl = new URL('../bin/publish.js', import.meta.url).href;

function fixture(t, branch) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'alemon-publish-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const cwd = path.join(root, 'source');
  const remote = path.join(root, 'remote.git');
  fs.mkdirSync(cwd);
  const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', HUSKY: '0' };
  const git = (...args) => execFileSync('git', args, { cwd, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '--bare', remote);
  git('init', '-b', branch);
  git('config', 'user.name', 'Publish Test');
  git('config', 'user.email', 'publish@example.test');
  git('config', 'commit.gpgsign', 'false');
  git('config', 'tag.gpgsign', 'false');
  git('remote', 'add', 'origin', remote);
  fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({ name: 'publish-fixture', version: '1.0.0' }, null, 2) + '\n');
  fs.mkdirSync(path.join(cwd, 'lib'));
  fs.writeFileSync(path.join(cwd, 'lib/index.js'), 'export default 1;\n');
  fs.writeFileSync(path.join(cwd, 'source.js'), '// excluded from publication\n');
  git('add', '.');
  git('commit', '-m', 'initial');
  const publish = (release, options = {}) => {
    const script = `import { publish } from ${JSON.stringify(publishUrl)}; await publish(${JSON.stringify(release)}, ${JSON.stringify({
      skipBuild: true,
      ...options
    })});`;
    return spawnSync(process.execPath, ['--input-type=module', '-e', script], { cwd, env, encoding: 'utf8' });
  };
  const succeed = (release, options) => {
    const result = publish(release, options);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  };
  const remoteGit = (...args) => git('--git-dir', remote, ...args);
  const version = () => JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8')).version;
  return { cwd, env, git, remoteGit, publish, succeed, version };
}

for (const branch of ['main', 'master']) {
  test(`${branch} publishes release and a version tag`, t => {
    const f = fixture(t, branch);
    f.succeed();
    assert.equal(f.remoteGit('rev-parse', 'refs/heads/release'), f.remoteGit('rev-parse', 'refs/tags/v1.0.0'));
    assert.equal(f.git('branch', '--show-current'), branch);
    assert.equal(f.git('status', '--porcelain'), '');
    f.succeed();
    assert.equal(f.version(), '1.0.1');
    assert.equal(f.remoteGit('rev-parse', 'refs/heads/release'), f.remoteGit('rev-parse', 'refs/tags/v1.0.1'));
  });
}

for (const [branch, target] of [
  ['develop', 'develop-release'],
  ['feature/login', 'feature-login-release'],
  ['codex/soul-path-v1', 'codex-soul-path-v1-release'],
  ['feature/team/login', 'feature-team-login-release']
]) {
  test(`${branch} publishes repeatedly without tags or a version bump`, t => {
    const f = fixture(t, branch);
    f.git('tag', 'v9.0.0');
    f.git('push', 'origin', 'refs/tags/v9.0.0');
    const oldTag = f.remoteGit('rev-parse', 'refs/tags/v9.0.0');
    f.succeed();
    assert.equal(JSON.parse(f.remoteGit('show', `refs/heads/${target}:package.json`)).version, '1.0.0');
    assert.equal(f.remoteGit('ls-tree', '--name-only', target), 'lib\npackage.json');
    f.succeed();
    assert.equal(f.git('tag', '--list'), 'v9.0.0');
    assert.equal(f.remoteGit('tag', '--list'), 'v9.0.0');
    assert.equal(f.remoteGit('rev-parse', 'refs/tags/v9.0.0'), oldTag);
    assert.equal(f.version(), '1.0.0');
    assert.equal(f.git('status', '--porcelain'), '');
    f.succeed('patch');
    assert.equal(f.version(), '1.0.1');
    assert.equal(f.remoteGit('tag', '--list'), 'v9.0.0');
    assert.equal(f.git('status', '--porcelain'), '');
  });
}

test('target override does not change the source branch tag policy', t => {
  const f = fixture(t, 'develop');
  f.succeed(undefined, { branch: 'release' });
  assert.ok(f.remoteGit('rev-parse', 'refs/heads/release'));
  assert.equal(f.remoteGit('tag', '--list'), '');
  f.git('checkout', '-b', 'main');
  f.succeed(undefined, { branch: 'custom-release' });
  assert.equal(f.remoteGit('rev-parse', 'refs/heads/custom-release'), f.remoteGit('rev-parse', 'refs/tags/v1.0.0'));
});

test('dry-run restores the version and creates no branches or tags', t => {
  const f = fixture(t, 'develop');
  f.succeed('patch', { dryRun: true });
  assert.equal(f.version(), '1.0.0');
  assert.equal(f.git('status', '--porcelain'), '');
  assert.equal(f.git('branch', '--format=%(refname:short)'), 'develop');
  assert.equal(f.git('tag', '--list'), '');
  assert.equal(f.remoteGit('for-each-ref'), '');
});

test('npm file selection does not run lifecycle scripts or parse their logs as JSON', t => {
  const f = fixture(t, 'develop');
  const pkgPath = path.join(f.cwd, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  pkg.files = ['lib'];
  pkg.scripts = { prepack: 'node prepack.cjs' };
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  fs.writeFileSync(path.join(f.cwd, 'prepack.cjs'), 'console.log("yarn run v1.22.22"); require("node:fs").writeFileSync("lifecycle-ran", "yes");\n');
  f.git('add', '.');
  f.git('commit', '-m', 'add pack lifecycle');
  f.succeed();
  assert.equal(fs.existsSync(path.join(f.cwd, 'lifecycle-ran')), false);
  assert.equal(f.remoteGit('ls-tree', '--name-only', 'develop-release'), 'lib\npackage.json');
  assert.equal(f.remoteGit('tag', '--list'), '');
});

test('rejects detached HEAD and publishing over the source branch before changing files', t => {
  const f = fixture(t, 'develop');
  const sameBranch = f.publish('patch', { branch: 'develop' });
  assert.notEqual(sameBranch.status, 0);
  assert.match(sameBranch.stderr, /发布目标分支不能与源码分支相同/);
  f.git('checkout', '--detach');
  const detached = f.publish('patch');
  assert.notEqual(detached.status, 0);
  assert.match(detached.stderr, /detached HEAD/);
  assert.equal(f.version(), '1.0.0');
  assert.equal(f.git('status', '--porcelain'), '');
});

for (const selection of ['default', 'files', 'npmignore']) {
  test(`${selection} publication cleans only the artifact package manifest`, t => {
    const f = fixture(t, 'develop');
    const pkgPath = path.join(f.cwd, 'package.json');
    const pkg = {
      name: 'publish-fixture',
      version: '1.0.0',
      private: true,
      workspaces: ['packages/*'],
      devDependencies: { typescript: '^5.0.0' },
      packageManager: 'yarn@1.22.22',
      scripts: Object.fromEntries(
        ['build', 'prepublish', 'prepare', 'prepublishOnly', 'prepack', 'postpack', 'publish', 'postpublish', 'install', 'postinstall', 'start'].map(script => [
          script,
          `echo ${script}`
        ])
      ),
      type: 'module',
      main: './lib/index.js',
      exports: { '.': './lib/index.js' },
      dependencies: { example: '^1.0.0' },
      peerDependencies: { peer: '^1.0.0' },
      optionalDependencies: { optional: '^1.0.0' },
      engines: { node: '>=20' },
      publishConfig: { access: 'public' }
    };
    if (selection === 'files') pkg.files = ['lib'];
    if (selection === 'npmignore') fs.writeFileSync(path.join(f.cwd, '.npmignore'), 'source.js\n');
    const original = JSON.stringify(pkg, null, 2) + '\n';
    fs.writeFileSync(pkgPath, original);
    f.git('add', '.');
    f.git('commit', '-m', 'configure source manifest');

    f.succeed('patch', { dryRun: true });
    assert.equal(fs.readFileSync(pkgPath, 'utf8'), original);
    assert.equal(f.remoteGit('for-each-ref'), '');

    f.succeed('patch');
    const expected = { ...pkg, version: '1.0.1', scripts: { install: 'echo install', postinstall: 'echo postinstall', start: 'echo start' } };
    for (const field of ['private', 'workspaces', 'devDependencies', 'packageManager']) delete expected[field];
    assert.deepEqual(JSON.parse(f.remoteGit('show', 'refs/heads/develop-release:package.json')), expected);
    assert.deepEqual(JSON.parse(fs.readFileSync(pkgPath, 'utf8')), { ...pkg, version: '1.0.1' });
    assert.equal(f.git('status', '--porcelain'), '');
  });
}

test('publication omits scripts when only build lifecycle scripts remain', t => {
  const f = fixture(t, 'develop');
  const pkgPath = path.join(f.cwd, 'package.json');
  const pkg = { name: 'publish-fixture', version: '1.0.0', scripts: { build: 'echo build', prepare: 'echo prepare' } };
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  f.git('add', '.');
  f.git('commit', '-m', 'configure build scripts');
  f.succeed();
  assert.deepEqual(JSON.parse(f.remoteGit('show', 'refs/heads/develop-release:package.json')), { name: pkg.name, version: pkg.version });
  assert.deepEqual(JSON.parse(fs.readFileSync(pkgPath, 'utf8')), pkg);
});

test('failed npm file selection restores the source manifest and its scripts', t => {
  const f = fixture(t, 'develop');
  const pkgPath = path.join(f.cwd, 'package.json');
  const pkg = { name: 'publish-fixture', version: '1.0.0', files: ['lib'], scripts: { prepare: 'echo prepare' } };
  const original = JSON.stringify(pkg, null, 2) + '\n';
  fs.writeFileSync(pkgPath, original);
  f.git('add', '.');
  f.git('commit', '-m', 'configure invalid package');
  const binDir = path.join(f.cwd, '.test-bin');
  fs.mkdirSync(binDir);
  fs.writeFileSync(path.join(binDir, 'npm'), '#!/bin/sh\nif [ "$1" = "--version" ]; then echo 10; exit 0; fi\nexit 1\n', { mode: 0o755 });
  f.env.PATH = `${binDir}${path.delimiter}${f.env.PATH}`;
  const result = f.publish(undefined, { gitChecks: false });
  fs.rmSync(binDir, { recursive: true });
  assert.notEqual(result.status, 0);
  assert.equal(fs.readFileSync(pkgPath, 'utf8'), original);
  assert.equal(f.git('status', '--porcelain'), '');
  assert.equal(f.remoteGit('for-each-ref'), '');
});
