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

function assertSourceUnchanged(f, before) {
  assert.equal(f.git('rev-parse', 'HEAD'), before.head);
  assert.equal(f.git('status', '--porcelain'), before.status);
  assert.equal(f.git('diff'), before.diff);
  assert.equal(f.git('diff', '--cached'), before.index);
  assert.equal(f.git('worktree', 'list', '--porcelain'), before.worktrees);
}

function snapshot(f) {
  return {
    head: f.git('rev-parse', 'HEAD'),
    status: f.git('status', '--porcelain'),
    diff: f.git('diff'),
    index: f.git('diff', '--cached'),
    worktrees: f.git('worktree', 'list', '--porcelain')
  };
}

for (const branch of ['main', 'master']) {
  test(`${branch} defaults to release and increments remote formal tags without changing source`, t => {
    const f = fixture(t, branch);
    const before = snapshot(f);
    f.succeed();
    assert.equal(f.remoteGit('rev-parse', 'refs/heads/release'), f.remoteGit('rev-parse', 'refs/tags/v0.0.1'));
    f.succeed();
    assert.equal(JSON.parse(f.remoteGit('show', 'release:package.json')).version, '0.0.2');
    assert.equal(f.remoteGit('rev-parse', 'refs/heads/release'), f.remoteGit('rev-parse', 'refs/tags/v0.0.2'));
    assert.equal(f.version(), '1.0.0');
    assertSourceUnchanged(f, before);
  });
}

for (const [source, target, tagged] of [
  ['develop', 'release', true],
  ['main', 'custom-release', true],
  ['main', 'preview', false],
  ['feature/login', undefined, true],
  ['develop', undefined, true]
]) {
  test(`${source} -> ${target || 'default'} tags when target follows release naming rules`, t => {
    const f = fixture(t, source);
    f.succeed('v2.3.4', target ? { branch: target } : {});
    const dest = target || `${source.replaceAll('/', '-')}-release`;
    assert.equal(JSON.parse(f.remoteGit('show', `${dest}:package.json`)).version, '2.3.4');
    assert.equal(f.remoteGit('tag', '--list'), tagged ? 'v2.3.4' : '');
    assert.equal(f.git('branch', '--show-current'), source);
  });
}

test('latest formal tag ignores prereleases and local package version, including remote-only tags', t => {
  const f = fixture(t, 'develop');
  for (const tag of ['v2.9.9', 'v2.10.3', 'v99.0.0-beta.1', 'v02.0.0']) {
    f.git('tag', tag);
    f.git('push', 'origin', `refs/tags/${tag}`);
    f.git('tag', '-d', tag);
  }
  f.succeed();
  assert.equal(JSON.parse(f.remoteGit('show', 'develop-release:package.json')).version, '2.10.4');
});

test('dirty source and index are untouched; only committed files are published', t => {
  const f = fixture(t, 'develop');
  fs.writeFileSync(path.join(f.cwd, 'lib/index.js'), 'uncommitted artifact');
  f.git('add', 'lib/index.js');
  fs.writeFileSync(path.join(f.cwd, 'lib/index.js'), 'another unstaged artifact');
  fs.writeFileSync(path.join(f.cwd, 'package.json'), 'invalid uncommitted JSON');
  fs.writeFileSync(path.join(f.cwd, 'lib/untracked.js'), 'untracked artifact');
  const before = snapshot(f);
  const result = f.publish();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, new RegExp(`源码 commit: ${before.head}`));
  assert.equal(f.remoteGit('show', 'develop-release:lib/index.js'), 'export default 1;');
  assert.equal(f.remoteGit('ls-tree', '-r', '--name-only', 'develop-release'), 'lib/index.js\npackage.json');
  assert.equal(JSON.parse(f.remoteGit('show', 'develop-release:package.json')).gitHead, before.head);
  assert.match(f.remoteGit('log', '-1', '--format=%B', 'develop-release'), new RegExp(`Source-Branch: develop\nSource-Commit: ${before.head}`));
  assertSourceUnchanged(f, before);
});

for (const version of ['1.0.0-beta.01', '1.0.0+', '01.0.0', 'unknown', '1.2']) {
  test(`rejects invalid version input ${version}`, t => {
    const f = fixture(t, 'develop');
    const before = snapshot(f);
    assert.notEqual(f.publish(version).status, 0);
    assert.equal(f.remoteGit('for-each-ref'), '');
    assertSourceUnchanged(f, before);
  });
}

test('dry-run leaves source and remote unchanged and cleans isolated worktrees', t => {
  const f = fixture(t, 'develop');
  const before = snapshot(f);
  f.succeed('2.0.0', { dryRun: true });
  assertSourceUnchanged(f, before);
  assert.equal(f.remoteGit('for-each-ref'), '');
});

test('existing tags are never overwritten', t => {
  const f = fixture(t, 'main');
  f.succeed('1.0.0');
  const refs = f.remoteGit('show-ref');
  const result = f.publish('1.0.0');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /已存在/);
  assert.equal(f.remoteGit('show-ref'), refs);
});

for (const selection of ['default', 'files', 'npmignore']) {
  test(`${selection} cleans artifact manifest only and suppresses pack lifecycle scripts`, t => {
    const f = fixture(t, 'develop');
    const pkgPath = path.join(f.cwd, 'package.json');
    const pkg = {
      name: 'publish-fixture',
      version: '9.0.0-beta.1',
      private: true,
      packageManager: 'npm@10.0.0',
      devDependencies: { example: '*' },
      scripts: { prepare: 'exit 1', prepack: 'exit 1', build: 'exit 1', start: 'node lib/index.js' }
    };
    if (selection === 'files') pkg.files = ['lib'];
    if (selection === 'npmignore') fs.writeFileSync(path.join(f.cwd, '.npmignore'), 'source.js\n');
    fs.writeFileSync(pkgPath, JSON.stringify(pkg));
    f.git('add', '.');
    f.git('commit', '-m', 'configure package');
    const before = snapshot(f);
    f.succeed();
    const artifact = JSON.parse(f.remoteGit('show', 'develop-release:package.json'));
    assert.equal(artifact.version, '0.0.1');
    assert.equal(artifact.private, undefined);
    assert.equal(artifact.devDependencies, undefined);
    assert.equal(artifact.packageManager, undefined);
    assert.deepEqual(artifact.scripts, { start: 'node lib/index.js' });
    assert.equal(fs.readFileSync(pkgPath, 'utf8'), JSON.stringify(pkg));
    assertSourceUnchanged(f, before);
  });
}

test('isolated build installs committed local dependencies and exposes pinned source identity', t => {
  const f = fixture(t, 'develop');
  fs.mkdirSync(path.join(f.cwd, 'dependency'));
  fs.writeFileSync(path.join(f.cwd, 'dependency/package.json'), JSON.stringify({ name: 'local-build-dep', version: '1.0.0', main: 'index.js' }));
  fs.writeFileSync(path.join(f.cwd, 'dependency/index.js'), 'module.exports = "committed dependency";');
  fs.writeFileSync(
    path.join(f.cwd, 'package.json'),
    JSON.stringify({
      name: 'publish-fixture',
      version: '1.0.0',
      devDependencies: { 'local-build-dep': 'file:./dependency' },
      scripts: { build: 'node build.cjs' }
    })
  );
  fs.writeFileSync(
    path.join(f.cwd, 'build.cjs'),
    `const fs = require('node:fs');
fs.writeFileSync('lib/index.js', JSON.stringify({ dependency: require('local-build-dep'), branch: process.env.ALEMON_PUBLISH_SOURCE_BRANCH, commit: process.env.ALEMON_PUBLISH_SOURCE_COMMIT, cwd: process.cwd(), version: require('./package.json').version }));`
  );
  f.git('add', '.');
  f.git('commit', '-m', 'configure real build');
  fs.writeFileSync(path.join(f.cwd, 'build.cjs'), 'throw new Error("uncommitted script must not run");');
  const before = snapshot(f);
  f.succeed(undefined, { skipBuild: false });
  const artifact = JSON.parse(f.remoteGit('show', 'develop-release:lib/index.js'));
  assert.equal(artifact.dependency, 'committed dependency');
  assert.equal(artifact.branch, 'develop');
  assert.equal(artifact.commit, before.head);
  assert.equal(artifact.version, '0.0.1');
  assert.notEqual(artifact.cwd, f.cwd);
  assert.equal(fs.existsSync(artifact.cwd), false);
  assert.equal(fs.existsSync(path.join(f.cwd, 'node_modules')), false);
  assertSourceUnchanged(f, before);
});

test('subdirectory publication builds the committed package at its repository-relative path', t => {
  const f = fixture(t, 'develop');
  const subdir = path.join(f.cwd, 'packages', 'sub');
  fs.mkdirSync(path.join(subdir, 'lib'), { recursive: true });
  fs.writeFileSync(path.join(subdir, 'package.json'), '{"name":"sub-package","version":"1.0.0"}');
  fs.writeFileSync(path.join(subdir, 'lib/index.js'), 'sub artifact');
  f.git('add', '.');
  f.git('commit', '-m', 'add subpackage');
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', `import { publish } from ${JSON.stringify(publishUrl)}; await publish(undefined, {skipBuild:true});`],
    { cwd: subdir, env: f.env, encoding: 'utf8' }
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(JSON.parse(f.remoteGit('show', 'develop-release:package.json')).name, 'sub-package');
});

test('failed build cleans worktree and preserves source state', t => {
  const f = fixture(t, 'develop');
  fs.writeFileSync(
    path.join(f.cwd, 'package.json'),
    JSON.stringify({ name: 'publish-fixture', version: '1.0.0', scripts: { build: 'node -e "process.exit(1)"' } })
  );
  f.git('add', '.');
  f.git('commit', '-m', 'failing build');
  const before = snapshot(f);
  assert.notEqual(f.publish(undefined, { skipBuild: false }).status, 0);
  assertSourceUnchanged(f, before);
  assert.equal(f.remoteGit('for-each-ref'), '');
});

test('failed atomic push publishes neither branch nor tag and cleans worktrees', t => {
  const f = fixture(t, 'main');
  const remotePath = f.git('remote', 'get-url', 'origin');
  fs.writeFileSync(path.join(remotePath, 'hooks/pre-receive'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });
  const before = snapshot(f);
  assert.notEqual(f.publish().status, 0);
  assertSourceUnchanged(f, before);
  assert.equal(f.remoteGit('for-each-ref'), '');
});

test('rejects detached HEAD and same source/target branch', t => {
  const f = fixture(t, 'develop');
  assert.notEqual(f.publish(undefined, { branch: 'develop' }).status, 0);
  f.git('checkout', '--detach');
  assert.notEqual(f.publish().status, 0);
  assert.equal(f.remoteGit('for-each-ref'), '');
});

test('CLI supports explicit versions, increment types and prerelease flags', t => {
  const f = fixture(t, 'develop');
  const cli = new URL('../bin/alemonc.js', import.meta.url).pathname;
  for (const [args, success] of [
    [['v1.2.3'], true],
    [['1.2.3-beta.0'], true],
    [['patch'], true],
    [['prerelease', '--preid', 'beta'], true],
    [['prerelease', '--preid', 'bad/id'], false]
  ]) {
    const result = spawnSync(process.execPath, [cli, 'publish', ...args, '--dry-run', '--skip-build'], { cwd: f.cwd, env: f.env, encoding: 'utf8' });
    assert.equal(result.status === 0, success, result.stdout + result.stderr);
  }
});

for (const [release, expected] of [
  ['patch', '1.2.4'],
  ['minor', '1.3.0'],
  ['major', '2.0.0'],
  ['prepatch', '1.2.4-beta.0'],
  ['preminor', '1.3.0-beta.0'],
  ['premajor', '2.0.0-beta.0'],
  ['prerelease', '1.2.4-beta.0'],
  ['v3.0.0-rc.1+build.5', '3.0.0-rc.1+build.5']
]) {
  test(`release ${release} resolves to ${expected} from latest formal tag`, t => {
    const f = fixture(t, 'main');
    f.git('tag', 'v1.2.3');
    f.git('tag', 'v99.0.0-alpha.0');
    const before = snapshot(f);
    f.succeed(release);
    assert.equal(JSON.parse(f.remoteGit('show', 'release:package.json')).version, expected);
    assert.ok(f.remoteGit('rev-parse', `refs/tags/v${expected}`));
    assertSourceUnchanged(f, before);
  });
}

test('prerelease increments remote channel numerically and resets after stable promotion', t => {
  const f = fixture(t, 'main');
  f.succeed('1.2.3');
  f.succeed('1.3.0-beta.9');
  f.succeed('1.3.0-beta.10');
  f.succeed('prerelease');
  assert.ok(f.remoteGit('rev-parse', 'refs/tags/v1.3.0-beta.11'));
  f.succeed('prerelease', { preid: 'rc' });
  assert.ok(f.remoteGit('rev-parse', 'refs/tags/v1.2.4-rc.0'));
  f.succeed('1.3.0');
  f.succeed('prerelease');
  assert.ok(f.remoteGit('rev-parse', 'refs/tags/v1.3.1-beta.0'));
});

test('preminor can be continued and promoted using minor without clobbering tags', t => {
  const f = fixture(t, 'main');
  f.succeed('1.2.3');
  f.succeed('preminor', { preid: 'next' });
  assert.notEqual(f.publish('preminor', { preid: 'next' }).status, 0);
  f.succeed('prerelease', { preid: 'next' });
  assert.ok(f.remoteGit('rev-parse', 'refs/tags/v1.3.0-next.1'));
  f.succeed('minor');
  assert.ok(f.remoteGit('rev-parse', 'refs/tags/v1.3.0'));
});

test('prerelease without tags starts at 0.0.1 and preview does not create tags', t => {
  const f = fixture(t, 'main');
  f.succeed('prerelease', { branch: 'preview', preid: 'alpha' });
  assert.equal(JSON.parse(f.remoteGit('show', 'preview:package.json')).version, '0.0.1-alpha.0');
  assert.equal(f.remoteGit('tag', '--list'), '');
});

test('generated release branches support version increments, prereleases and explicit versions', t => {
  const f = fixture(t, 'feature/login');
  for (const [release, expected] of [
    ['patch', '0.0.1'],
    ['minor', '0.1.0'],
    ['major', '1.0.0'],
    ['prepatch', '1.0.1-beta.0'],
    ['prerelease', '1.0.1-beta.1'],
    ['v2.0.0-rc.1', '2.0.0-rc.1']
  ]) {
    f.succeed(release);
    assert.equal(JSON.parse(f.remoteGit('show', 'feature-login-release:package.json')).version, expected);
    assert.equal(f.remoteGit('rev-parse', 'feature-login-release'), f.remoteGit('rev-parse', `refs/tags/v${expected}`));
  }
  assert.equal(f.git('status', '--porcelain'), '');
});

for (const withBuild of [false, true]) {
  test(`bundle runs in isolation${withBuild ? ' before build' : ' without build'} and is removed from artifact scripts`, t => {
    const f = fixture(t, 'develop');
    const scripts = { bundle: 'node bundle.cjs' };
    if (withBuild) scripts.build = 'node -e "process.exit(1)"';
    fs.writeFileSync(path.join(f.cwd, 'package.json'), JSON.stringify({ name: 'publish-fixture', version: '1.0.0', scripts }));
    fs.writeFileSync(path.join(f.cwd, 'bundle.cjs'), 'require("node:fs").writeFileSync("lib/index.js", "bundled artifact");');
    f.git('add', '.');
    f.git('commit', '-m', 'configure bundle');
    const before = snapshot(f);
    f.succeed(undefined, { skipBuild: false });
    assert.equal(f.remoteGit('show', 'develop-release:lib/index.js'), 'bundled artifact');
    assert.equal(JSON.parse(f.remoteGit('show', 'develop-release:package.json')).scripts, undefined);
    assertSourceUnchanged(f, before);
  });
}

test('bundle failure aborts publication without falling back to build', t => {
  const f = fixture(t, 'develop');
  fs.writeFileSync(
    path.join(f.cwd, 'package.json'),
    JSON.stringify({
      name: 'publish-fixture',
      version: '1.0.0',
      scripts: { bundle: 'node -e "process.exit(1)"', build: 'node -e "process.exit(0)"' }
    })
  );
  f.git('add', '.');
  f.git('commit', '-m', 'configure failing bundle');
  const before = snapshot(f);
  assert.notEqual(f.publish(undefined, { skipBuild: false }).status, 0);
  assert.equal(f.remoteGit('for-each-ref'), '');
  assertSourceUnchanged(f, before);
  f.succeed(undefined, { skipBuild: true });
  assert.equal(f.remoteGit('show', 'develop-release:lib/index.js'), 'export default 1;');
});

test('alemonjs.build selects a named script before bundle and build', t => {
  const f = fixture(t, 'develop');
  fs.writeFileSync(
    path.join(f.cwd, 'package.json'),
    JSON.stringify({
      name: 'publish-fixture',
      version: '1.0.0',
      alemonjs: { build: 'build:release' },
      scripts: { 'build:release': 'node custom.cjs', bundle: 'exit 1', build: 'exit 1', start: 'node lib/index.js' }
    })
  );
  fs.writeFileSync(path.join(f.cwd, 'custom.cjs'), 'require("node:fs").writeFileSync("lib/index.js", "custom artifact");');
  f.git('add', '.');
  f.git('commit', '-m', 'configure custom script');
  const before = snapshot(f);
  f.succeed(undefined, { skipBuild: false });
  assert.equal(f.remoteGit('show', 'develop-release:lib/index.js'), 'custom artifact');
  assert.deepEqual(JSON.parse(f.remoteGit('show', 'develop-release:package.json')).scripts, { start: 'node lib/index.js' });
  assertSourceUnchanged(f, before);
});

for (const configured of ['missing', '', true]) {
  test(`invalid alemonjs.build ${JSON.stringify(configured)} does not silently fall back`, t => {
    const f = fixture(t, 'develop');
    fs.writeFileSync(
      path.join(f.cwd, 'package.json'),
      JSON.stringify({
        name: 'publish-fixture',
        version: '1.0.0',
        alemonjs: { build: configured },
        scripts: { bundle: 'echo bundle' }
      })
    );
    f.git('add', '.');
    f.git('commit', '-m', 'configure invalid build script');
    const before = snapshot(f);
    const result = f.publish(undefined, { skipBuild: false });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /alemonjs.build 必须指定/);
    assert.equal(f.remoteGit('for-each-ref'), '');
    assertSourceUnchanged(f, before);
  });
}
