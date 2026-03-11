import { start } from 'alemonjs';
import { createServer } from 'jsxp';
// --jsxp 启动 jsxp 服务
if (process.argv.includes('--jsxp')) {
  void createServer();
} else {
  start('src/index.ts');
}
