import { AsyncLocalStorage } from 'node:async_hooks';
import { withAppContext } from '../app-context.js';
import { dirname, join } from 'path';
import { existsSync, readFileSync, realpathSync } from 'fs';
import { createEventName, showErrorModule } from '../../../common/utils.js';
import { getRecursiveDirFiles } from '../../../common/utils.js';
import type { StoreMiddlewareItem, StoreResponseItem, DefineChildrenValue, childrenCallback } from '../../../types/index.js';
import { ChildrenApp, getRuntimeApp, getChildrenApp } from '../store.js';
import { registerExpose } from '../../../application/expose.js';
import { ResultCode } from '../../../common/variable.js';
import { fileSuffixMiddleware } from '../../../common/variable.js';
import { scheduleCancelByApp, registerAppDir, unregisterAppDir } from '../schedule-store.js';
import { validateContextRegistration } from '../../context.js';
import module from 'module';
import {
  clearRuntimeAppKoaRouters,
  registerRuntimeApp,
  setConfiguredAppOrder,
  setRuntimeAppKoaRouters,
  updateRuntimeAppCapabilities,
  updateRuntimeAppStatus
} from '../store.js';
import { normalizeAppsConfig } from '../../../common/apps-config.js';
import { getConfig } from '../../../common/config.js';
import { scopedMap } from '../../../common/runtime-scope.js';
import { isValidPackageName } from '../http/routers/utils.js';
import { prepareAppGeneration, getAppGeneration, importAppFile } from './app-import.js';
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
      const rootExport = Object.keys(exportsField).some(key => key.startsWith('.')) ? exportsField['.'] : exportsField;

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
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) ?? {};
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
export const loadChildren = (mainPath: string, appName: string) => withAppContext(appName, () => loadChildrenInContext(mainPath, appName));

const deactivateApp = async (appName: string, status: 'failed' | 'disposed', error?: unknown, cycle = getChildrenApp(appName)?.cycle) => {
  clearRuntimeAppKoaRouters(appName);
  updateRuntimeAppStatus(appName, status, error);
  new ChildrenApp(appName).un();
  scheduleCancelByApp(appName);
  try {
    await dispatchAppDispose(appName, error, cycle);
  } finally {
    scheduleCancelByApp(appName);
    unregisterAppDir(appName);
  }
};

const loadChildrenInContext = async (mainPath: string, appName: string) => {
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

  let app: childrenCallback = null;

  try {
    const moduleApp: {
      default: DefineChildrenValue;
    } = await importAppFile(mainPath, getAppGeneration(appName));

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

    await app?.onCreated?.();

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

      await app?.onMounted?.(emptyStore);
      await dispatchAppReady(appName, emptyStore);
      updateRuntimeAppStatus(appName, 'ready');
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

      await app?.onMounted?.(mountedStore);
      await dispatchAppReady(appName, mountedStore);
      updateRuntimeAppStatus(appName, 'ready');
    };

    if (app?.register) {
      await registerMounted();
    } else {
      await fileMounted();
    }
  } catch (error) {
    showErrorModule(error);
    await deactivateApp(appName, 'failed', error, app);
  }
};

export const refreshAppPackageOrder = () => {
  const apps = normalizeAppsConfig(getConfig().value?.apps);

  setConfiguredAppOrder(apps.map(app => app.name));

  return apps;
};

const pending = scopedMap<string, Promise<unknown>>();
const packageOperations = new AsyncLocalStorage<ReadonlyMap<string, { active: boolean }>>();

const managePackage = <T>(appName: string, operation: () => Promise<T>, refreshOrder = true): Promise<T> => {
  if (typeof appName !== 'string' || appName === 'main' || !isValidPackageName(appName)) {
    return Promise.reject(new Error('Invalid application package name: ' + appName));
  }

  const parentOperations = packageOperations.getStore();

  if (parentOperations?.get(appName)?.active) {
    return Promise.reject(new Error('Reentrant application package operation: ' + appName));
  }

  const task = (pending.get(appName) ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      const state = { active: true };
      const operations = new Map(parentOperations);

      operations.set(appName, state);
      try {
        return await packageOperations.run(operations, () => {
          if (refreshOrder) {
            refreshAppPackageOrder();
          }

          return operation();
        });
      } finally {
        state.active = false;
      }
    });

  pending.set(appName, task);

  return task.finally(() => {
    if (pending.get(appName) === task) {
      pending.delete(appName);
    }
  });
};

const resolvePackage = (appName: string, refresh: boolean) => {
  const packageDir = resolvePackageDir(appName);
  const entry = packageDir && resolvePackageEntryFromPackageJson(packageDir);

  if (refresh && entry) {
    if (!existsSync(entry)) {
      throw new Error('The application package entry does not exist: ' + entry);
    }

    return realpathSync(entry);
  }

  try {
    const path = require.resolve(appName);

    if (existsSync(path)) {
      return path;
    }
  } catch (error) {
    if (!entry || !existsSync(entry)) {
      throw error;
    }
  }
  if (entry && existsSync(entry)) {
    return realpathSync(entry);
  }

  throw new Error('The application package entry does not exist: ' + appName);
};

const mountPackage = async (appName: string, reload: boolean) => {
  const current = getRuntimeApp(appName);

  if (current?.status === 'ready' && !reload) {
    return current;
  }

  const refresh = Boolean(current?.mainPath);

  try {
    const mainPath = resolvePackage(appName, refresh);

    const activateGeneration = refresh ? prepareAppGeneration(appName, resolvePackageRoot(dirname(mainPath))) : undefined;

    if (current?.status === 'ready') {
      await deactivateApp(appName, 'disposed');
    }
    activateGeneration?.();
    await loadChildren(mainPath, appName);
  } catch (error) {
    if (current?.status !== 'ready') {
      registerRuntimeApp({
        name: appName,
        kind: 'plugin',
        enabled: true,
        status: 'discovered',
        rootDir: current?.rootDir ?? '',
        mainPath: current?.mainPath ?? ''
      });
      updateRuntimeAppStatus(appName, 'failed', error);
    }
    throw error;
  }

  const result = getRuntimeApp(appName);

  if (result?.status !== 'ready') {
    throw new Error(result?.error?.message ?? 'Application failed to load: ' + appName);
  }

  return result;
};

/** Mount an installed application package in the current app process. */
export const loadAppPackage = (appName: string) => managePackage(appName, () => mountPackage(appName, false));

/** Detach an application and await its disposal hooks. */
export const unloadAppPackage = (appName: string) =>
  managePackage(appName, async () => {
    if (getRuntimeApp(appName)?.status === 'ready') {
      await deactivateApp(appName, 'disposed');
    }
  });

/** Replace an installed ESM application with the code currently on disk. */
export const reloadAppPackage = (appName: string) => managePackage(appName, () => mountPackage(appName, true));

/** Startup loader keeps a failed package from preventing other apps from loading. */
export const loadChildrenFile = async (appName: string) => {
  try {
    await managePackage(appName, () => mountPackage(appName, false), false);
  } catch (error) {
    showErrorModule(error);
  }
};
