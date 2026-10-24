#!/usr/bin/env node
import fs from 'fs';
import { join, relative } from 'path';
import os from 'os';
import { execSync } from 'child_process';
import spawn from 'cross-spawn';

const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const RELEASE_TYPES = new Set(['patch', 'minor', 'major', 'prepatch', 'preminor', 'premajor', 'prerelease']);
const VERSION_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const DEFAULT_PUBLISH_FILES = ['lib', 'package.json', 'README.md'];
const SOURCE_PACKAGE_FIELDS = ['private', 'workspaces', 'devDependencies', 'packageManager'];
const SOURCE_PACKAGE_SCRIPTS = ['bundle', 'build', 'prepublish', 'prepare', 'prepublishOnly', 'prepack', 'postpack', 'publish', 'postpublish'];

function readPackageJson(cwd) {
  const pkgPath = join(cwd, 'package.json');

  if (!fs.existsSync(pkgPath)) {
    throw new Error('未找到 package.json');
  }

  return {
    pkgPath,
    pkg: JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  };
}

function runCommand(command, args, options = {}) {
  const result = spawn.sync(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: false,
    ...options
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`命令执行失败: ${command} ${args.join(' ')}`);
  }
}

function getCommandOutput(command) {
  return execSync(command, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  }).trim();
}

function hasCommand(command) {
  const result = spawn.sync(command, ['--version'], {
    cwd: process.cwd(),
    stdio: 'ignore'
  });

  return !result.error && result.status === 0;
}

function isGitRepo() {
  try {
    return getCommandOutput('git rev-parse --is-inside-work-tree') === 'true';
  } catch {
    return false;
  }
}

function normalizeVersionInput(version) {
  return String(version).trim().replace(/^v/, '');
}

function validVersion(version) {
  const match = VERSION_RE.exec(version);
  return Boolean(match && (!match[4] || match[4].split('.').every(id => !/^0\d+$/.test(id))));
}

function compareVersions(a, b) {
  const av = VERSION_RE.exec(a);
  const bv = VERSION_RE.exec(b);
  for (let i = 1; i <= 3; i++) {
    if (BigInt(av[i]) !== BigInt(bv[i])) return BigInt(av[i]) > BigInt(bv[i]) ? 1 : -1;
  }
  if (!av[4] || !bv[4]) return av[4] === bv[4] ? 0 : av[4] ? -1 : 1;
  const ap = av[4].split('.');
  const bp = bv[4].split('.');
  for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
    if (ap[i] === bp[i]) continue;
    if (ap[i] === undefined) return -1;
    if (bp[i] === undefined) return 1;
    const an = /^\d+$/.test(ap[i]);
    const bn = /^\d+$/.test(bp[i]);
    if (an && bn) return BigInt(ap[i]) > BigInt(bp[i]) ? 1 : -1;
    if (an !== bn) return an ? -1 : 1;
    return ap[i] > bp[i] ? 1 : -1;
  }
  return 0;
}

function resolveTargetVersion(versions, release, preid = 'beta') {
  if (!/^[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*$/.test(preid) || preid.split('.').some(id => /^0\d+$/.test(id))) {
    throw new Error(`非法预发布标识: ${preid}`);
  }
  const latestVersion = versions.find(version => SEMVER_RE.test(version));
  if (release !== undefined && !RELEASE_TYPES.has(release)) {
    const version = normalizeVersionInput(release);
    if (!validVersion(version)) throw new Error(`非法版本号或发布类型: ${release}`);
    return version;
  }
  const type = release || 'patch';
  const [major, minor, patch] = (latestVersion || '0.0.0').split('.').map(BigInt);
  if (type === 'prerelease') {
    const previous = versions.find(version => {
      const prerelease = VERSION_RE.exec(version)[4];
      return (
        prerelease?.startsWith(`${preid}.`) &&
        /^\d+$/.test(prerelease.slice(preid.length + 1)) &&
        (!latestVersion || compareVersions(version, latestVersion) > 0)
      );
    });
    if (previous) {
      const match = VERSION_RE.exec(previous);
      return `${match[1]}.${match[2]}.${match[3]}-${preid}.${BigInt(match[4].slice(preid.length + 1)) + 1n}`;
    }
  }
  let core;
  if (type === 'major' || type === 'premajor') core = `${major + 1n}.0.0`;
  else if (type === 'minor' || type === 'preminor') core = `${major}.${minor + 1n}.0`;
  else core = `${major}.${minor}.${patch + 1n}`;
  return type.startsWith('pre') ? `${core}-${preid}.0` : core;
}

function updateVersion(pkgPath, pkg, version) {
  pkg.version = version;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

function getPackResult(cwd = process.cwd()) {
  // 构建已单独执行，这里只读取文件清单，避免生命周期脚本的日志混入 JSON。
  const pkgPath = join(cwd, 'package.json');
  const original = fs.readFileSync(pkgPath);
  const pkg = JSON.parse(original.toString('utf8'));
  // 部分 npm 版本的 prepare 不遵守 --ignore-scripts，读取清单期间临时屏蔽。
  let output;
  try {
    if (pkg.scripts) {
      delete pkg.scripts;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    }
    output = execSync('npm pack --json --dry-run --ignore-scripts', {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 20 * 1024 * 1024
    }).trim();
  } finally {
    fs.writeFileSync(pkgPath, original);
  }

  const result = JSON.parse(output);
  if (!Array.isArray(result) || result.length === 0 || !Array.isArray(result[0]?.files)) {
    throw new Error('无法解析 npm pack 文件清单');
  }

  return result[0];
}

function hasNpmPublishRules(pkg, cwd) {
  if (fs.existsSync(join(cwd, '.npmignore'))) {
    return true;
  }

  return Array.isArray(pkg.files) && pkg.files.length > 0;
}

function getDefaultPublishFiles(cwd) {
  return DEFAULT_PUBLISH_FILES.filter(file => fs.existsSync(join(cwd, file)));
}

function warnDefaultPublishState(pkg, publishFiles, cwd) {
  const hasLibDir = fs.existsSync(join(cwd, 'lib'));
  const mainField = typeof pkg.main === 'string' ? pkg.main : '';

  if (!hasLibDir && mainField.startsWith('./lib/')) {
    console.warn(`警告: 缺少 lib/ 目录，但 package.json main 指向 ${mainField}，将继续发布`);
  }

  if (publishFiles.length === 0) {
    console.warn('警告: 默认发布规则下没有匹配到任何文件');
  }
}

function copyPublishFiles(files, cwd, publishDir) {
  for (const item of files) {
    const relativePath = typeof item === 'string' ? item : item.path;
    const sourcePath = join(cwd, relativePath);
    const targetPath = join(publishDir, relativePath);

    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    if (fs.statSync(sourcePath).isDirectory()) {
      fs.mkdirSync(join(targetPath, '..'), { recursive: true });
      fs.cpSync(sourcePath, targetPath, { recursive: true });
      continue;
    }

    fs.mkdirSync(join(targetPath, '..'), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }

  return publishDir;
}

function resolveBuildScript(pkg) {
  const configured = pkg.alemonjs?.build;
  if (configured !== undefined) {
    if (typeof configured !== 'string' || !configured.trim() || typeof pkg.scripts?.[configured] !== 'string' || !pkg.scripts[configured].trim()) {
      throw new Error('alemonjs.build 必须指定 scripts 中存在的非空脚本名称');
    }
    return configured;
  }
  return pkg.scripts?.bundle ? 'bundle' : pkg.scripts?.build ? 'build' : null;
}

function preparePublishPackage(publishDir, buildScript) {
  const pkgPath = join(publishDir, 'package.json');
  const pkg = Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(pkgPath, 'utf8'))).filter(([field]) => !SOURCE_PACKAGE_FIELDS.includes(field)));

  // 产物已构建完成，不应在安装或再次发包时触发源码构建。
  if (pkg.scripts) {
    pkg.scripts = Object.fromEntries(Object.entries(pkg.scripts).filter(([script]) => !SOURCE_PACKAGE_SCRIPTS.includes(script) && script !== buildScript));
    if (Object.keys(pkg.scripts).length === 0) {
      delete pkg.scripts;
    }
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

function removeDirContents(dirPath) {
  for (const entry of fs.readdirSync(dirPath)) {
    if (entry === '.git') {
      continue;
    }

    fs.rmSync(join(dirPath, entry), { recursive: true, force: true });
  }
}

function copyDirContents(sourceDir, targetDir) {
  for (const entry of fs.readdirSync(sourceDir)) {
    fs.cpSync(join(sourceDir, entry), join(targetDir, entry), { recursive: true });
  }
}

function ensureGitRepo() {
  if (!isGitRepo()) {
    throw new Error('当前目录不是 git 仓库，无法执行 git 发布');
  }
}

function gitOutput(args, cwd = process.cwd()) {
  const result = spawn.sync('git', args, { cwd, encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} 失败: ${result.stderr}`);
  return result.stdout.trim();
}

function getReleaseVersions(remoteRefs) {
  const tags = [...gitOutput(['tag', '--list']).split('\n'), ...remoteRefs.split('\n').map(line => line.split('\t')[1]?.replace(/^refs\/tags\//, ''))];
  return [...new Set(tags.filter(tag => tag?.startsWith('v') && validVersion(tag.slice(1))).map(tag => tag.slice(1)))].sort((a, b) => compareVersions(b, a));
}

function cleanupWorktree(worktreeDir) {
  if (!worktreeDir) return;
  const result = spawn.sync('git', ['worktree', 'remove', '--force', worktreeDir], { stdio: 'ignore' });
  if (result.status !== 0 && fs.existsSync(worktreeDir)) {
    console.warn(`未能清理临时 worktree，请手动检查: ${worktreeDir}`);
  }
}

function installBuildDependencies(buildRoot, buildCwd, env) {
  // 子包有自己的锁文件时使用子包，否则在仓库根目录安装 workspace 依赖。
  const locks = ['package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml'];
  const cwd = locks.some(file => fs.existsSync(join(buildCwd, file))) ? buildCwd : buildRoot;
  const { pkg } = readPackageJson(cwd);
  const manager =
    pkg.packageManager?.split('@')[0] || (fs.existsSync(join(cwd, 'pnpm-lock.yaml')) ? 'pnpm' : fs.existsSync(join(cwd, 'yarn.lock')) ? 'yarn' : 'npm');
  let args;
  if (manager === 'npm') {
    args = [locks.slice(0, 2).some(file => fs.existsSync(join(cwd, file))) ? 'ci' : 'install', '--include=dev'];
  } else if (manager === 'yarn') {
    const version = pkg.packageManager?.split('@')[1] || '1';
    args = Number(version.split('.')[0]) >= 2 ? ['install', '--immutable'] : ['install', '--frozen-lockfile', '--production=false'];
  } else if (manager === 'pnpm') {
    args = ['install', '--frozen-lockfile', '--prod=false'];
  } else {
    throw new Error(`不支持的包管理器: ${manager}`);
  }
  console.log(`隔离空间安装依赖: ${manager} ${args.join(' ')}`);
  runCommand(manager, args, { cwd, env });
  return manager;
}

export async function publish(release, options = {}) {
  if (!hasCommand('git')) throw new Error('未找到 git，请先安装 git');
  if (!hasCommand('npm')) throw new Error('未找到 npm，请先安装 Node.js/npm');
  // 在创建 worktree 或访问远端之前验证参数。
  resolveTargetVersion([], release, options.preid);
  ensureGitRepo();

  const sourceBranch = gitOutput(['branch', '--show-current']);
  const sourceCommit = gitOutput(['rev-parse', 'HEAD']);
  if (!sourceBranch) throw new Error('当前处于 detached HEAD，请先切换到源码分支再发布');
  const sourceRoot = fs.realpathSync(gitOutput(['rev-parse', '--show-toplevel']));
  const packageRelativePath = relative(sourceRoot, fs.realpathSync(process.cwd()));
  const releaseBranch = options.branch || (['main', 'master'].includes(sourceBranch) ? 'release' : `${sourceBranch.replaceAll('/', '-')}-release`);
  runCommand('git', ['check-ref-format', '--branch', releaseBranch]);
  if (releaseBranch === sourceBranch) throw new Error('发布目标分支不能与源码分支相同');
  const shouldTag = releaseBranch === 'release' || releaseBranch.endsWith('-release');
  console.log(`源码分支: ${sourceBranch}`);
  console.log(`源码 commit: ${sourceCommit}`);
  console.log('发布仅使用该 commit；未提交、暂存和未跟踪内容不会参与构建');

  const remoteRefs = gitOutput(['ls-remote', '--refs', 'origin']);
  const versions = getReleaseVersions(remoteRefs);
  const latestVersion = versions.find(version => SEMVER_RE.test(version));
  const targetVersion = resolveTargetVersion(versions, release, options.preid);
  const gitTagName = `v${targetVersion}`;
  if (shouldTag && (remoteRefs.split('\n').some(line => line.endsWith(`\trefs/tags/${gitTagName}`)) || gitOutput(['tag', '--list', gitTagName]))) {
    throw new Error(`标签 ${gitTagName} 已存在，请选择新的版本`);
  }
  console.log(`最新正式标签: ${latestVersion ? `v${latestVersion}` : '无'}`);
  console.log(`目标版本: ${targetVersion}`);
  console.log(`发布分支: ${releaseBranch}`);
  console.log(`git 标签: ${shouldTag ? gitTagName : '不创建'}`);

  const tempRoot = fs.mkdtempSync(join(os.tmpdir(), 'alemon-publish-'));
  const buildRoot = join(tempRoot, 'source');
  const artifactRoot = join(tempRoot, 'artifact');
  const publishDir = join(tempRoot, 'package');
  fs.mkdirSync(publishDir);
  try {
    runCommand('git', ['worktree', 'add', '--detach', buildRoot, sourceCommit]);
    const buildCwd = join(buildRoot, packageRelativePath);
    const { pkgPath, pkg } = readPackageJson(buildCwd);
    if (!pkg.name) throw new Error('package.json 缺少 name');
    console.log(`发布包: ${pkg.name}`);
    console.log(`隔离构建目录: ${buildCwd}`);
    const env = { ...process.env, ALEMON_PUBLISH_SOURCE_BRANCH: sourceBranch, ALEMON_PUBLISH_SOURCE_COMMIT: sourceCommit };
    const buildScript = resolveBuildScript(pkg);
    let buildManager;
    if (!options.skipBuild && buildScript) {
      buildManager = installBuildDependencies(buildRoot, buildCwd, env);
    }
    updateVersion(pkgPath, pkg, targetVersion);
    if (!options.skipBuild && buildScript) {
      console.log(`执行打包脚本: ${buildScript}`);
      runCommand(buildManager, ['run', buildScript], { cwd: buildCwd, env });
    } else {
      console.log(options.skipBuild ? '已跳过构建，仅使用 commit 中已有的产物' : '未定义 bundle 或 build 脚本，跳过构建');
    }
    const useNpmRules = hasNpmPublishRules(pkg, buildCwd);
    const publishFiles = useNpmRules ? getPackResult(buildCwd).files : getDefaultPublishFiles(buildCwd);
    if (!useNpmRules) warnDefaultPublishState(pkg, publishFiles, buildCwd);
    copyPublishFiles(publishFiles, buildCwd, publishDir);
    preparePublishPackage(publishDir, buildScript);
    const artifactPkgPath = join(publishDir, 'package.json');
    const artifactPkg = JSON.parse(fs.readFileSync(artifactPkgPath, 'utf8'));
    artifactPkg.version = targetVersion;
    artifactPkg.gitHead = sourceCommit;
    fs.writeFileSync(artifactPkgPath, JSON.stringify(artifactPkg, null, 2) + '\n');
    console.log(`发布规则: ${useNpmRules ? 'npm' : 'default'}`);
    console.log(`发布文件数: ${publishFiles.length}`);
    if (options.dryRun) {
      console.log('dry-run 模式，不会真正推送到 git');
      return;
    }

    let base = sourceCommit;
    if (remoteRefs.split('\n').some(line => line.endsWith(`\trefs/heads/${releaseBranch}`))) {
      runCommand('git', ['fetch', '--no-tags', 'origin', `refs/heads/${releaseBranch}`]);
      base = gitOutput(['rev-parse', 'FETCH_HEAD']);
    }
    runCommand('git', ['worktree', 'add', '--detach', artifactRoot, base]);
    removeDirContents(artifactRoot);
    copyDirContents(publishDir, artifactRoot);
    runCommand('git', ['add', '-A'], { cwd: artifactRoot });
    if (gitOutput(['diff', '--cached', '--name-only'], artifactRoot)) {
      runCommand('git', ['commit', '-m', `release: ${gitTagName}\n\nSource-Branch: ${sourceBranch}\nSource-Commit: ${sourceCommit}`], { cwd: artifactRoot });
    }
    const refs = [`HEAD:refs/heads/${releaseBranch}`];
    if (shouldTag) refs.push(`HEAD:refs/tags/${gitTagName}`);
    // 原子推送分支和标签，禁止覆盖已有标签或强推发布历史。
    runCommand('git', ['push', '--atomic', 'origin', ...refs], { cwd: artifactRoot });
    console.log(`发布完成: ${pkg.name}@${targetVersion}（${sourceBranch}@${sourceCommit}）`);
  } finally {
    cleanupWorktree(artifactRoot);
    cleanupWorktree(buildRoot);
    fs.rmSync(publishDir, { recursive: true, force: true });
    if (fs.readdirSync(tempRoot).length === 0) fs.rmdirSync(tempRoot);
  }
}
