import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { createEventName, showErrorModule } from '../../../common/utils.js';
import { getRecursiveDirFiles } from '../../../common/utils.js';
import type { StoreMiddlewareItem, StoreResponseItem, DefineChildrenValue, childrenCallback } from '../../../types/index.js';
import { ChildrenApp } from '../store.js';
import { registerExpose } from '../../../application/expose.js';
import { ResultCode } from '../../../common/variable.js';
import { fileSuffixMiddleware } from '../../../common/variable.js';
import { scheduleCancelByApp, registerAppDir, unregisterAppDir } from '../schedule-store.js';
import { validateContextRegistration } from '../../context.js';
import module from 'module';
import { clearRuntimeAppKoaRouters, registerRuntimeApp, setRuntimeAppKoaRouters, updateRuntimeAppCapabilities, updateRuntimeAppStatus } from '../store.js';
import { dispatchAppDispose, dispatchAppReady, dispatchRuntimeStatusChange } from '../lifecycle-callbacks.js';

const initRequire = () => {};

initRequire.resolve = () => '';
const require = module?.createRequire?.(import.meta.url) ?? initRequire;

const resolvePackageDir = (appName: string) => {
  const resolveWithPaths = require.resolve as typeof require.resolve & {
    paths?: (request: string) => string[] | null;
  };
  const candidatePaths = resolveWithPaths?.paths?.(appName) ?? [];

  for (const basePath of candidatePaths) {
    const packageDir = join(basePath, appName);

    if (existsSync(join(packageDir, 'package.json'))) {
      return packageDir;
    }
  }

  return null;
};

const resolvePackageEntryFromPackageJson = (packageDir: string) => {
  const packageJsonPath = join(packageDir, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return null;
  }

  try {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) ?? {};
    const exportsField = pkg?.exports;
    let entry: string | null = null;

    if (typeof exportsField === 'string') {
      entry = exportsField;
    } else if (exportsField && typeof exportsField === 'object') {
      const rootExport = exportsField['.'];

      if (typeof rootExport === 'string') {
        entry = rootExport;
      } else if (rootExport && typeof rootExport === 'object') {
        entry = rootExport.import ?? rootExport.default ?? rootExport.require ?? null;
      }
    }

    if (!entry) {
      entry = pkg?.module ?? pkg?.main ?? 'index.js';
    }

    if (typeof entry !== 'string' || !entry.trim()) {
      return null;
    }

    return join(packageDir, entry);
  } catch {
    return null;
  }
};

const resolvePackageRoot = (startDir: string) => {
  let currentDir = startDir;

  while (currentDir && currentDir !== dirname(currentDir)) {
    if (existsSync(join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = dirname(currentDir);
  }

  return startDir;
};

const detectDefaultWebRoot = (packageRoot: string) => {
  if (existsSync(join(packageRoot, 'dist', 'index.html'))) {
    return 'dist';
  }
  if (existsSync(join(packageRoot, 'index.html'))) {
    return '';
  }

  return null;
};

const detectWebCapability = (startDir: string) => {
  const packageRoot = resolvePackageRoot(startDir);
  const packageJsonPath = join(packageRoot, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return Boolean(detectDefaultWebRoot(packageRoot));
  }

  try {
    const pkg = require(packageJsonPath) ?? {};
    const root = pkg?.alemonjs?.web?.root;

    if (typeof root === 'string' && root.trim()) {
      return existsSync(join(packageRoot, root));
    }
  } catch {
    // ignore package parsing failures here; runtime route access still rechecks at request time
  }

  return Boolean(detectDefaultWebRoot(packageRoot));
};

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
  const kind = appName === 'main' ? 'main' : 'plugin';
  const baseCapabilities = {
    event: false,
    httpApi: existsSync(join(mainDir, 'route', 'api')),
    web: detectWebCapability(mainDir),
    schedule: false,
    expose: false
  };

  registerRuntimeApp({
    name: appName,
    kind,
    enabled: true,
    status: 'discovered',
    rootDir: mainDir,
    mainPath,
    capabilities: baseCapabilities
  });
  updateRuntimeAppStatus(appName, 'loading');

  // 注册应用目录，用于 schedule 自动推断 appName
  registerAppDir(appName, mainDir);

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

    let app: childrenCallback = null;

    if (typeof moduleApp?.default?.callback !== 'function') {
      app = moduleApp?.default.callback;
    } else {
      app = await moduleApp.default.callback();
    }

    App.pushCycle(app);
    await dispatchRuntimeStatusChange({
      appName,
      previousStatus: 'discovered',
      status: 'loading'
    });

    const unMounted = async e => {
      showErrorModule(e);
      clearRuntimeAppKoaRouters(appName);
      updateRuntimeAppStatus(appName, 'failed', e);
      // 卸载时自动清理该应用的所有定时任务
      scheduleCancelByApp(appName);
      // 注销应用目录映射
      unregisterAppDir(appName);
      // 卸载
      await dispatchAppDispose(appName, e);
      App.un();
    };

    // onCreated 创建
    try {
      if (app?.onCreated) {
        await app?.onCreated();
      }
    } catch (e) {
      void unMounted(e);

      // 出错了，结束后续的操作。
      return;
    }

    const registerMounted = async () => {
      const res = await app?.register();
      validateContextRegistration(res);
      const hasEventCapability = Boolean(
        res && (res?.response || res?.middleware || res?.responseRouter || res?.middlewareRouter || res?.middlewareContent || res?.responseContent)
      );
      const hasExposeCapability = Boolean(res?.expose);
      const hasKoaRouterCapability = Boolean(res?.koaRouter);

      // 注册接口的结果。
      if (res && (res?.response || res?.middleware || res?.responseRouter || res?.middlewareRouter || res?.middlewareContent || res?.responseContent)) {
        App.register(res);
      }

      setRuntimeAppKoaRouters(appName, res?.koaRouter);

      // 注册 expose 协议
      if (res?.expose) {
        registerExpose(appName, res.expose.getConfigs());
      }
      updateRuntimeAppCapabilities(appName, {
        ...baseCapabilities,
        httpApi: baseCapabilities.httpApi || hasKoaRouterCapability,
        event: hasEventCapability,
        expose: hasExposeCapability
      });

      // 加载完成
      App.on();

      // mounted
      const emptyStore = { response: [], responseMiddleware: {}, middleware: [] };

      try {
        if (app?.onMounted) {
          await app.onMounted(emptyStore);
        }
        await dispatchAppReady(appName, emptyStore);
        updateRuntimeAppStatus(appName, 'ready');
      } catch (e) {
        void unMounted(e);
      }
    };

    const fileMounted = async () => {
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
        const responseItem: StoreResponseItem = {
          input: mainDir,
          dir: dirname(file.path),
          path: file.path,
          name: file.name,
          stateKey,
          appName: appName
        };

        resData.push(responseItem);
      }
      App.pushResponse(resData);

      /**
       * load response middleware files
       */
      const responseAndMiddlewareFiles = getRecursiveDirFiles(responseDir, item => fileSuffixMiddleware.test(item.name));
      const resAndMwData: {
        [key: string]: StoreResponseItem;
      } = {};

      for (const file of responseAndMiddlewareFiles) {
        // 切掉 mainDir
        const url = file.path.replace(mainDir, '');
        const stateKey = createEventName(url, appName);
        const responseItem: StoreResponseItem = {
          input: mainDir,
          dir: dirname(file.path),
          path: file.path,
          name: file.name,
          stateKey,
          appName: appName
        };

        resAndMwData[stateKey] = responseItem;
      }

      App.pushResponseMiddleware(resAndMwData);

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
      updateRuntimeAppCapabilities(appName, {
        ...baseCapabilities,
        event: resData.length > 0 || Object.keys(resAndMwData).length > 0 || mwData.length > 0
      });

      // 加载完成
      App.on();

      // mounted
      const mountedStore = { response: resData, responseMiddleware: resAndMwData, middleware: mwData };

      try {
        if (app?.onMounted) {
          await app.onMounted(mountedStore);
        }
        await dispatchAppReady(appName, mountedStore);
        updateRuntimeAppStatus(appName, 'ready');
      } catch (e) {
        void unMounted(e);
      }
    };

    // onMounted 加载
    try {
      if (app?.register) {
        // 优先使用 register
        await registerMounted();
      } else {
        // 使用文件方式加载
        await fileMounted();
      }
    } catch (e) {
      void unMounted(e);
    }

    // unMounted 卸载
  } catch (e) {
    showErrorModule(e);
    clearRuntimeAppKoaRouters(appName);
    updateRuntimeAppStatus(appName, 'failed', e);
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
    let mainPath = require.resolve(appName);

    if (!existsSync(mainPath)) {
      const packageDir = resolvePackageDir(appName);
      const fallbackMainPath = packageDir ? resolvePackageEntryFromPackageJson(packageDir) : null;

      if (fallbackMainPath) {
        mainPath = fallbackMainPath;
      }
    }

    // 不存在 main
    if (!existsSync(mainPath)) {
      updateRuntimeAppStatus(appName, 'failed', new Error('The main file does not exist,' + mainPath));
      logger.error({
        code: ResultCode.FailParams,
        message: 'The main file does not exist,' + mainPath,
        data: null
      });

      return;
    }
    registerRuntimeApp({
      name: appName,
      kind: 'plugin',
      enabled: true,
      status: 'discovered',
      rootDir: dirname(mainPath),
      mainPath
    });
    await loadChildren(mainPath, appName);
  } catch (e) {
    const packageDir = resolvePackageDir(appName);
    const fallbackMainPath = packageDir ? resolvePackageEntryFromPackageJson(packageDir) : null;

    if (fallbackMainPath && existsSync(fallbackMainPath)) {
      registerRuntimeApp({
        name: appName,
        kind: 'plugin',
        enabled: true,
        status: 'discovered',
        rootDir: dirname(fallbackMainPath),
        mainPath: fallbackMainPath
      });
      await loadChildren(fallbackMainPath, appName);

      return;
    }

    updateRuntimeAppStatus(appName, 'failed', e);
    showErrorModule(e);
  }
};
