import { spawnSync } from 'child_process';
import { cpSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';

const cmds = [
  ['lerna', 'run', 'build'],
];

for (const cmd of cmds) {
  const msg = spawnSync('npx', cmd, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (msg.error) {
    console.error(msg.error);
    process.exit(1); 
  }
}

// 得到所有 packages 文件 目录后缀是 frontend 的目录。
const dirs = readdirSync('./packages').filter((dir) => dir.endsWith('-frontend'));
for(const dir of dirs) {
  const input = join(process.cwd(), `packages/${dir}/dist`);
  const output = `./packages/${dir.replace('-frontend', '')}/dist`;
  rmSync(output, { recursive: true, force: true });
  cpSync(input, output, { recursive: true });
}