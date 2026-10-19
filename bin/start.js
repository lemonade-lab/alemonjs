#!/usr/bin/env node

import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const createExports = packageJson => {
  if (packageJson?.exports) {
    if (typeof packageJson.exports === 'string') {
      return packageJson.exports;
    } else if (typeof packageJson.exports === 'object') {
      return packageJson.exports['.'] || packageJson.exports['./index.js'];
    }
  }
};

const getInputExportPath = input => {
  const packageJsonPath = path.join(input ?? process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = require(packageJsonPath);
    const main = packageJson?.main || createExports(packageJson);
    if (main) {
      return main;
    }
  }
};

/**
 *
 * @param {*} dir
 */
export const start = () => {
  // 读取配置文件
  const main = getInputExportPath();
  import('../lib/index.js').then(res => {
    res.start(main);
  });
};
