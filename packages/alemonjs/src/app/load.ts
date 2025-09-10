import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { createEventName, showErrorModule } from '../core/utils.js';
import { getRecursiveDirFiles } from '../core/utils.js';
import { StoreMiddlewareItem, StoreResponseItem, DefineChildrenValue, ChildrenCycle } from '../types/index.js';
import { createRequire } from 'module';
import { ChildrenApp } from './store.js';
import { ResultCode } from '../core/variable.js';
import { fileSuffixMiddleware } from '../core/variable.js';
const require = createRequire(import.meta.url);

/**
 * 加载子模块
 * @param mainPath
 * @param appName
 * @throws {Error} - 如果 mainPath 无效，抛出错误。
 */
export const loadChildren = async (mainPath: string, appName: string) => {
  if (!mainPath || typeof mainPath !== 'string') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'The module path is not correct',
      data: null
    });

    return;
  }
  const mainDir = dirname(mainPath);
  const App = new ChildrenApp(appName);

  try {
    const moduleApp: {
      default: DefineChildrenValue;
    } = await import(`file://${mainPath}`);

    if (!moduleApp?.default) {
      throw new Error('The Children is not default');
    }
    if (!moduleApp?.default?._name) {
      throw new Error('The Children name is not correct');
    }
    if (moduleApp.default._name !== 'app') {
      throw new Error('The Children name is not correct');
    }
    if (!moduleApp?.default?.callback) {
      throw new Error('The Children callback is not correct');
    }

    let app: ChildrenCycle = null;

    if (typeof moduleApp?.default?.callback !== 'function') {
      app = moduleApp?.default.callback;
    } else {
      app = await moduleApp.default.callback();
    }

    App.pushSycle(app);

    const unMounted = async e => {
      showErrorModule(e);
      // 卸载
      App.un();
      try {
        app?.unMounted && (await app.unMounted(e));
      } catch (e) {
        // 卸载周期出意外，不需要进行卸载
        showErrorModule(e);
      }
    };

    // onCreated 创建
    try {
      app?.onCreated && (await app?.onCreated());
    } catch (e) {
      unMounted(e);

      // 出错了，结束后续的操作。
      return;
    }

    // onMounted 加载
    try {
      /**
       * load response files
       */
      const appsDir = join(mainDir, 'apps');
      const appsFiles = getRecursiveDirFiles(appsDir);
      // 使用 新 目录 response
      const responseDir = join(mainDir, 'response');
      const responseFiles = getRecursiveDirFiles(responseDir);
      const files = [...appsFiles, ...responseFiles];
      const resData: StoreResponseItem[] = [];

      for (const file of files) {
        // 切掉 mainDir
        const url = file.path.replace(mainDir, '');
        const stateKey = createEventName(url, appName);
        const reesponse: StoreResponseItem = {
          input: mainDir,
          dir: dirname(file.path),
          path: file.path,
          name: file.name,
          stateKey,
          appName: appName
        };

        resData.push(reesponse);
      }
      App.pushResponse(resData);
      /**
       * load middleware files
       */
      const mwDir = join(mainDir, 'middleware');
      const mwFiles = getRecursiveDirFiles(mwDir, item => fileSuffixMiddleware.test(item.name));
      const mwData: StoreMiddlewareItem[] = [];

      for (const file of mwFiles) {
        // 切掉 mainDir
        const url = file.path.replace(mainDir, '');
        const stateKey = createEventName(url, appName);
        const middleware: StoreMiddlewareItem = {
          input: mainDir,
          dir: dirname(file.path),
          path: file.path,
          name: file.name,
          stateKey,
          appName: appName
        };

        mwData.push(middleware);
      }
      App.pushMiddleware(mwData);
      App.on();
      try {
        app?.onMounted && (await app.onMounted({ response: resData, middleware: mwData }));
      } catch (e) {
        void unMounted(e);
      }
    } catch (e) {
      void unMounted(e);
    }

    // unMounted 卸载
  } catch (e) {
    showErrorModule(e);
    // 卸载
    App.un();
  }
};

/**
 * 模块文件
 * @param app
 */
export const loadChildrenFile = async (appName: string) => {
  if (typeof appName !== 'string') {
    logger.error({
      code: ResultCode.FailParams,
      message: 'The module name is not correct',
      data: null
    });

    return;
  }
  try {
    const mainPath = require.resolve(appName);

    // 不存在 main
    if (!existsSync(mainPath)) {
      logger.error({
        code: ResultCode.FailParams,
        message: 'The main file does not exist,' + mainPath,
        data: null
      });

      return;
    }
    void loadChildren(mainPath, appName);
  } catch (e) {
    showErrorModule(e);
  }
};
