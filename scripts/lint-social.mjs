import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// SDK declaration files are large. Isolate each TypeScript program instead of
// retaining every platform's type graph in one ESLint process.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const eslint = resolve(dirname(require.resolve('eslint/package.json')), 'bin/eslint.js');
const packages = JSON.parse(readFileSync(resolve(root, 'scripts/social-platforms.json'), 'utf8'));
let failed = false;
for (const source of packages.map(name => `packages/${name}/src`)) {
  const result = spawnSync(
    process.execPath,
    ['--max-old-space-size=8192', eslint, source, '--max-warnings=0', ...(process.argv.includes('--fix') ? ['--fix'] : [])],
    { cwd: root, stdio: 'inherit', timeout: 120_000 }
  );
  console.log(`${source}: ${result.status === 0 ? 'OK' : 'FAILED'}`);
  if (result.status !== 0 || result.error) {
    failed = true;
  }
}
process.exitCode = failed ? 1 : 0;
