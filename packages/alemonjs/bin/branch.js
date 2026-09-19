import spawn from 'cross-spawn';

function git(args) {
  const result = spawn.sync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (result.error) {
    if (result.error.code === 'ENOENT') {
      throw new Error('未找到 git，请先安装 git');
    }
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || `git ${args.join(' ')} 执行失败`);
  }

  return result.stdout.trim();
}

export function branch(name) {
  if (!name || !name.trim()) {
    throw new Error('请提供分支名称');
  }
  if (git(['rev-parse', '--is-inside-work-tree']) !== 'true') {
    throw new Error('当前目录不是 git 工作区');
  }

  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const branchName = `dev-${date}-${name}`;
  git(['check-ref-format', '--branch', branchName]);
  git(['checkout', '-b', branchName]);
  console.log(`已创建并切换到分支: ${branchName}`);
}
