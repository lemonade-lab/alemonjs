import { getConfig } from '../../../common/config.js';
import { loadChildren, loadChildrenFile } from './loadChild.js';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { ResultCode } from '../../../common/variable.js';
import { registerRuntimeApp } from '../store.js';
import module from 'module';

const initRequire = () => {};

initRequire.resolve = () => '';
const require = module?.createRequire?.(import.meta.url) ?? initRequire;

const loadApps = () => {
  const cfg = getConfig();
  const apps = Array.isArray(cfg.value?.apps)
    ? cfg.value.apps.filter(Boolean)
    : Object.entries(cfg.value?.apps ?? {})
        .filter(([, enabled]) => Boolean(enabled))
        .map(([name]) => name);

  // 去重
  const uniqueApps = Array.from(new Set(apps));

  return Promise.all(
    uniqueApps.map(async app => {
      registerRuntimeApp({
        name: app,
        kind: 'plugin',
        enabled: true,
        status: 'discovered',
        rootDir: '',
        mainPath: ''
      });
      await loadChildrenFile(app);
    })
  );
};

/**
 * @description 运行本地模块
 * @param input
 * @returns
 */
export const run = async (input: string) => {
  if (!input) {
    return;
  }
  const mainPath = join(process.cwd(), input);

  // 路径
  if (!existsSync(mainPath)) {
    logger.warn({
      code: ResultCode.Warn,
      message: '未找到指定的主应用入口文件，但不影响继续运行',
      data: null
    });

    return;
  }
  registerRuntimeApp({
    name: 'main',
    kind: 'main',
    enabled: true,
    status: 'discovered',
    rootDir: join(process.cwd(), dirname(input)),
    mainPath
  });
  // 指定运行的，name识别为 'main:res:xxx'
  await loadChildren(mainPath, 'main');
};

/**
 * 启动模块进程
 */
export async function loadModels() {
  // 如果为空，则默认读取本地的 package.json 中的 main 字段
  if (!process.env.input) {
    const pkgPath = join(process.cwd(), 'package.json');

    // 主动读的，要检查 package.json 是否存在 main 字段，如果没有，则不报错，继续运行
    if (existsSync(pkgPath)) {
      const pkg = require(pkgPath) ?? {};

      if (pkg?.main) {
        process.env.input = pkg.main;
      }
    }
  }

  await run(process.env.input ?? '');
  await loadApps();
}
