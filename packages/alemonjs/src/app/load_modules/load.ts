import { getConfig } from '../../core/config.js';
import { loadChildren, loadChildrenFile } from './loadChild.js';
import { join } from 'path';
import { existsSync } from 'fs';
import { ResultCode } from '../../core/variable.js';

const loadApps = () => {
  const cfg = getConfig();

  const apps = Array.isArray(cfg.value?.apps) ? cfg.value.apps : Object.keys(cfg.value?.apps ?? {}).filter(Boolean);

  // 去重
  const uniqueApps = Array.from(new Set(apps));

  void Promise.all(uniqueApps.map(app => loadChildrenFile(app)));
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
  if (!existsSync(input)) {
    logger.warn({
      code: ResultCode.Warn,
      message: '未找到主要入口文件',
      data: null
    });

    return;
  }
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
