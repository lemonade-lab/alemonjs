import { getConfig } from '../../core/config.js';
import { loadChildren, loadChildrenFile } from './loadChild.js';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { ResultCode } from '../../core/variable.js';
import { registerRuntimeApp } from '../store.js';

const loadApps = () => {
  const cfg = getConfig();
  const apps = Array.isArray(cfg.value?.apps)
    ? cfg.value.apps.filter(Boolean)
    : Object.entries(cfg.value?.apps ?? {})
        .filter(([, enabled]) => Boolean(enabled))
        .map(([name]) => name);

  // 去重
  const uniqueApps = Array.from(new Set(apps));

  uniqueApps.forEach(app => {
    registerRuntimeApp({
      name: app,
      kind: 'plugin',
      enabled: true,
      status: 'discovered',
      rootDir: '',
      mainPath: ''
    });
    void loadChildrenFile(app);
  });
};

/**
 * @description 运行本地模块
 * @param input
 * @returns
 */
export const run = (input: string) => {
  if (!input) {
    return;
  }
  const mainPath = join(process.cwd(), input);

  // 路径
  if (!existsSync(mainPath)) {
    logger.warn({
      code: ResultCode.Warn,
      message: '未找到主要入口文件',
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
  void loadChildren(mainPath, 'main');
};

/**
 * 启动模块进程
 */
export function loadModels() {
  const input = process.env.input ?? '';

  // 运行本地模块
  run(input);

  // load module
  loadApps();
}
