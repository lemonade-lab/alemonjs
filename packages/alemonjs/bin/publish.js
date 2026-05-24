#!/usr/bin/env node
import fs from 'fs';
import { join } from 'path';
import os from 'os';
import { execSync, spawnSync } from 'child_process';

const RELEASE_TYPES = new Set(['patch', 'minor', 'major', 'prepatch', 'preminor', 'premajor', 'prerelease']);
const PRERELEASE_IDS = new Set(['alpha', 'beta', 'rc', 'next']);
const SEMVER_RE = /^\d+\.\d+\.\d+(?:-(alpha|beta|rc|next)\.\d+)?$/;
const TAG_RE = /^v\d+\.\d+\.\d+(?:-(alpha|beta|rc|next)\.\d+)?$/;
const DEFAULT_PUBLISH_FILES = ['lib', 'package.json', 'README.md'];

function readPackageJson() {
  const pkgPath = join(process.cwd(), 'package.json');

  if (!fs.existsSync(pkgPath)) {
    throw new Error('未找到 package.json');
  }

  return {
    pkgPath,
    pkg: JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  };
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
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
  const result = spawnSync(command, ['--version'], {
    cwd: process.cwd(),
    stdio: 'ignore'
  });

  return !result.error;
}

function isGitRepo() {
  try {
    return getCommandOutput('git rev-parse --is-inside-work-tree') === 'true';
  } catch {
    return false;
  }
}

function ensureCleanGit() {
  const status = getCommandOutput('git status --porcelain');
  if (status) {
    throw new Error('工作区存在未提交改动，请先提交或使用 --no-git-checks 跳过检查');
  }
}

function normalizeVersionInput(version) {
  return String(version).trim().replace(/^v/, '');
}

function validatePreid(preid) {
  const value = String(preid || 'beta').trim();
  if (!PRERELEASE_IDS.has(value)) {
    throw new Error(`非法预发布标识: ${value}，仅允许 alpha、beta、rc、next`);
  }

  return value;
}

function parseVersion(version) {
  const matched = normalizeVersionInput(version).match(/^(\d+)\.(\d+)\.(\d+)(?:-((alpha|beta|rc|next)\.(\d+)))?$/);
  if (!matched) {
    throw new Error(`非法版本号: ${version}`);
  }

  return {
    major: Number(matched[1]),
    minor: Number(matched[2]),
    patch: Number(matched[3]),
    prerelease: matched[4] ?? null,
    prereleaseId: matched[5] ?? null,
    prereleaseNum: matched[6] ? Number(matched[6]) : null
  };
}

function compareVersions(a, b) {
  const av = parseVersion(a);
  const bv = parseVersion(b);

  for (const key of ['major', 'minor', 'patch']) {
    if (av[key] > bv[key]) return 1;
    if (av[key] < bv[key]) return -1;
  }

  if (av.prerelease === bv.prerelease) return 0;
  if (av.prerelease === null) return 1;
  if (bv.prerelease === null) return -1;

  return av.prerelease.localeCompare(bv.prerelease);
}

function incrementVersion(baseVersion, releaseType, preid = 'beta') {
  const parsed = parseVersion(baseVersion);
  const safePreid = validatePreid(preid);

  if (releaseType === 'patch') {
    return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
  }

  if (releaseType === 'minor') {
    return `${parsed.major}.${parsed.minor + 1}.0`;
  }

  if (releaseType === 'major') {
    return `${parsed.major + 1}.0.0`;
  }

  if (releaseType === 'prepatch') {
    return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}-${safePreid}.0`;
  }

  if (releaseType === 'preminor') {
    return `${parsed.major}.${parsed.minor + 1}.0-${safePreid}.0`;
  }

  if (releaseType === 'premajor') {
    return `${parsed.major + 1}.0.0-${safePreid}.0`;
  }

  if (releaseType === 'prerelease') {
    if (parsed.prerelease && parsed.prereleaseId === safePreid && parsed.prereleaseNum !== null) {
      return `${parsed.major}.${parsed.minor}.${parsed.patch}-${safePreid}.${parsed.prereleaseNum + 1}`;
    }

    return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}-${safePreid}.0`;
  }

  throw new Error(`不支持的发布类型: ${releaseType}`);
}

function resolveTargetVersion(localVersion, remoteVersion, release, preid) {
  if (!release) {
    if (!remoteVersion) {
      return localVersion;
    }

    if (compareVersions(localVersion, remoteVersion) > 0) {
      return localVersion;
    }

    return incrementVersion(remoteVersion, 'patch', preid);
  }

  if (RELEASE_TYPES.has(release)) {
    const base = remoteVersion && compareVersions(remoteVersion, localVersion) > 0 ? remoteVersion : localVersion;
    return incrementVersion(base, release, preid);
  }

  const normalizedRelease = normalizeVersionInput(release);

  if (SEMVER_RE.test(normalizedRelease)) {
    return normalizedRelease;
  }

  throw new Error(`无法识别的发布参数: ${release}`);
}

function updateVersion(pkgPath, pkg, version) {
  pkg.version = version;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

function getPackResult(cwd = process.cwd()) {
  const output = execSync('npm pack --json --dry-run', {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    maxBuffer: 20 * 1024 * 1024
  }).trim();

  const result = JSON.parse(output);
  if (!Array.isArray(result) || result.length === 0 || !Array.isArray(result[0]?.files)) {
    throw new Error('无法解析 npm pack 文件清单');
  }

  return result[0];
}

function hasNpmPublishRules(pkg) {
  if (fs.existsSync(join(process.cwd(), '.npmignore'))) {
    return true;
  }

  return Array.isArray(pkg.files) && pkg.files.length > 0;
}

function getDefaultPublishFiles() {
  return DEFAULT_PUBLISH_FILES.filter(file => fs.existsSync(join(process.cwd(), file)));
}

function warnDefaultPublishState(pkg, publishFiles) {
  const hasLibDir = fs.existsSync(join(process.cwd(), 'lib'));
  const mainField = typeof pkg.main === 'string' ? pkg.main : '';

  if (!hasLibDir && mainField.startsWith('./lib/')) {
    console.warn(`警告: 缺少 lib/ 目录，但 package.json main 指向 ${mainField}，将继续发布`);
  }

  if (publishFiles.length === 0) {
    console.warn('警告: 默认发布规则下没有匹配到任何文件');
  }
}

function copyPublishFiles(files) {
  const publishDir = fs.mkdtempSync(join(os.tmpdir(), 'alemon-publish-'));

  for (const item of files) {
    const relativePath = typeof item === 'string' ? item : item.path;
    const sourcePath = join(process.cwd(), relativePath);
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

function getLatestReleaseVersion() {
  const tags = getCommandOutput('git tag --list --sort=-v:refname');
  if (!tags) {
    return '';
  }

  for (const tag of tags.split('\n')) {
    const value = tag.trim();
    if (TAG_RE.test(value)) {
      return value.slice(1);
    }
  }

  return '';
}

function remoteBranchExists(branch) {
  const result = spawnSync('git', ['ls-remote', '--exit-code', '--heads', 'origin', branch], {
    cwd: process.cwd(),
    stdio: 'ignore'
  });

  return result.status === 0;
}

function localBranchExists(branch) {
  const result = spawnSync('git', ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], {
    cwd: process.cwd(),
    stdio: 'ignore'
  });

  return result.status === 0;
}

function createReleaseWorktree(branch) {
  const worktreeDir = fs.mkdtempSync(join(os.tmpdir(), 'alemon-worktree-'));

  if (remoteBranchExists(branch)) {
    runCommand('git', ['fetch', 'origin', branch]);
    runCommand('git', ['worktree', 'add', '-B', branch, worktreeDir, `origin/${branch}`]);
  } else if (localBranchExists(branch)) {
    runCommand('git', ['worktree', 'add', worktreeDir, branch]);
  } else {
    runCommand('git', ['worktree', 'add', '-b', branch, worktreeDir]);
  }

  return worktreeDir;
}

function cleanupWorktree(worktreeDir) {
  if (!worktreeDir) {
    return;
  }

  spawnSync('git', ['worktree', 'remove', '--force', worktreeDir], {
    cwd: process.cwd(),
    stdio: 'ignore'
  });
  fs.rmSync(worktreeDir, { recursive: true, force: true });
}

export async function publish(release, options = {}) {
  if (!hasCommand('git')) {
    throw new Error('未找到 git，请先安装 git');
  }

  if (!hasCommand('npm')) {
    throw new Error('未找到 npm，请先安装 Node.js/npm');
  }

  const { pkgPath, pkg } = readPackageJson();
  const packageName = pkg.name;
  const localVersion = normalizeVersionInput(String(pkg.version || '').trim());

  if (!packageName) {
    throw new Error('package.json 缺少 name');
  }

  if (!SEMVER_RE.test(localVersion)) {
    throw new Error(`当前 package.json 版本号非法: ${localVersion}`);
  }

  console.log(`发布包: ${packageName}`);
  console.log(`本地版本: ${localVersion}`);

  ensureGitRepo();

  const releaseBranch = options.branch || 'release';
  const remoteVersion = getLatestReleaseVersion();
  if (remoteVersion) {
    console.log(`最新 git tag: v${remoteVersion}`);
  } else {
    console.log('最新 git tag: 无，将按首次发布处理');
  }

  if (options.gitChecks !== false && isGitRepo()) {
    ensureCleanGit();
  }

  const preid = validatePreid(options.preid);
  const targetVersion = resolveTargetVersion(localVersion, remoteVersion, release, preid);
  const gitTagName = `v${targetVersion}`;
  console.log(`目标版本: ${targetVersion}`);
  console.log(`发布分支: ${releaseBranch}`);
  console.log(`git 标签: ${gitTagName}`);

  if (targetVersion !== localVersion) {
    updateVersion(pkgPath, pkg, targetVersion);
    console.log(`已更新 package.json 版本: ${localVersion} -> ${targetVersion}`);
  }

  let publishDir = null;
  let worktreeDir = null;
  try {
    if (!options.skipBuild) {
      if (pkg.scripts?.build) {
        console.log('执行构建...');
        runCommand('npm', ['run', 'build']);
      } else {
        console.log('未定义 build 脚本，跳过构建');
      }
    } else {
      console.log('已跳过构建');
    }

    const useNpmRules = hasNpmPublishRules(pkg);
    const publishFiles = useNpmRules ? getPackResult().files : getDefaultPublishFiles();

    if (!useNpmRules) {
      warnDefaultPublishState(pkg, publishFiles);
    }

    publishDir = copyPublishFiles(publishFiles);

    console.log(`发布规则: ${useNpmRules ? 'npm' : 'default'}`);
    console.log(`发布文件数: ${publishFiles.length}`);

    if (options.dryRun) {
      if (targetVersion !== localVersion) {
        updateVersion(pkgPath, pkg, localVersion);
        console.log(`已回滚 package.json 版本到 ${localVersion}`);
      }
      console.log('dry-run 模式，不会真正推送到 git');
      return;
    }

    console.log('准备 release worktree...');
    worktreeDir = createReleaseWorktree(releaseBranch);
    removeDirContents(worktreeDir);
    copyDirContents(publishDir, worktreeDir);

    runCommand('git', ['-C', worktreeDir, 'add', '-A']);
    const hasChanges = spawnSync('git', ['-C', worktreeDir, 'diff', '--cached', '--quiet']).status !== 0;
    if (!hasChanges) {
      console.log('release 分支无文件变化，跳过提交');
    } else {
      runCommand('git', ['-C', worktreeDir, 'commit', '-m', `release: ${gitTagName}`]);
      runCommand('git', ['-C', worktreeDir, 'push', 'origin', `HEAD:${releaseBranch}`]);
      console.log(`已推送到分支: ${releaseBranch}`);
    }

    runCommand('git', ['-C', worktreeDir, 'tag', '-f', gitTagName]);
    runCommand('git', ['-C', worktreeDir, 'push', 'origin', gitTagName, '--force']);
    console.log(`发布完成: ${packageName}@${targetVersion}`);
  } catch (error) {
    if (targetVersion !== localVersion) {
      updateVersion(pkgPath, pkg, localVersion);
      console.log(`已回滚 package.json 版本到 ${localVersion}`);
    }
    throw error;
  } finally {
    if (publishDir) {
      fs.rmSync(publishDir, { recursive: true, force: true });
    }
    cleanupWorktree(worktreeDir);
  }

  if (options.gitChecks !== false && isGitRepo()) {
    runCommand('git', ['add', 'package.json']);
    runCommand('git', ['commit', '-m', `release: ${gitTagName}`]);
    console.log(`已记录源码版本变更: ${gitTagName}`);
  }
}
