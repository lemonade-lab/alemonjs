import { spawnSync } from 'child_process';
import { cpSync, rmSync } from 'fs';
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
    process.exit(1); // Exit with a non-zero status code
  }
}

const input = join(process.cwd(), 'packages/db-frontend/dist');
const output = './packages/db/dist';
rmSync(output, { recursive: true, force: true });
cpSync(input, output, { recursive: true });