import KoaRouter from 'koa-router';
import fs, { existsSync } from 'fs';
import path, { join, dirname } from 'path';
import mime from 'mime-types';
import { renderHelloHtml } from './hello.html';
import { formatPath, getModuelFile, safePath, isValidPackageName } from './utils';
import { collectMiddlewares, runMiddlewares } from './middleware';
import module from 'module';
import { ResultCode } from '../../../../common/index.js';
import {
  RuntimeAppStatus,
  getChildrenApp,
  getRuntimeApp,
  getRuntimeAppKoaRouters,
  hasRuntimeAppCapability,
  listRuntimeAppKoaRouters,
  listRuntimeApps,
  toRuntimeAppSnapshot
} from '../../store.js';
import { dispatchHttpError } from '../../lifecycle-callbacks.js';

const initRequire = () => {};

initRequire.resolve = () => '';
const require = module?.createRequire?.(import.meta.url) ?? initRequire;

const router = new KoaRouter({
  prefix: '/'
});

const resolvePackageRoot = (startDir: string) => {
  let currentDir = startDir;

  while (currentDir && currentDir !== path.dirname(currentDir)) {
    if (existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  return startDir;
};

const readWebRootConfig = (packageRoot: string) => {
  const packageJsonPath = path.join(packageRoot, 'package.json');

  if (!existsSync(packageJsonPath)) {
    if (existsSync(path.join(packageRoot, 'dist', 'index.html'))) {
      return 'dist';
    }

    return '';
  }

  const pkg = require(packageJsonPath) ?? {};
  const configuredRoot = pkg?.alemonjs?.web?.root ?? '';

  if (typeof configuredRoot === 'string' && configuredRoot.trim()) {
    return configuredRoot;
  }

  if (existsSync(path.join(packageRoot, 'dist', 'index.html'))) {
    return 'dist';
  }

  return '';
};

const matchBasePath = (requestPath: string, basePath: string) => {
  if (!basePath) {
    return requestPath;
  }
  if (requestPath === basePath) {
    return '/';
  }
  if (requestPath.startsWith(`${basePath}/`)) {
    return requestPath.slice(basePath.length) || '/';
  }

  return '';
};

const rewriteCtxPath = async (ctx: KoaRouter.RouterContext, nextPath: string, handler: () => Promise<void>) => {
  const search = ctx.querystring ? `?${ctx.querystring}` : '';
  const originalUrl = ctx.url;
  const originalReqUrl = ctx.req.url;

  ctx.url = `${nextPath}${search}`;
  ctx.req.url = `${nextPath}${search}`;

  try {
    await handler();
  } finally {
    ctx.url = originalUrl;
    ctx.req.url = originalReqUrl;
  }
};

const denyRuntimeAppAccess = (ctx: KoaRouter.RouterContext, appName: string, capability: 'httpApi' | 'web') => {
  const runtimeApp = getRuntimeApp(appName);

  if (!runtimeApp?.enabled) {
    ctx.status = 404;
    ctx.body = {
      code: 404,
      message: '应用未注册或未启用',
      data: null
    };

    return null;
  }

  if (runtimeApp.status === 'discovered' || runtimeApp.status === 'loading') {
    ctx.status = 503;
    ctx.body = {
      code: 503,
      message: '应用正在初始化',
      data: {
        app: appName,
        status: runtimeApp.status
      }
    };

    return null;
  }

  if (runtimeApp.status === 'failed') {
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: '应用生命周期失败',
      data: {
        app: appName,
        status: runtimeApp.status,
        lifecycle: 'failed'
      }
    };

    return null;
  }

  if (runtimeApp.status === 'disposed') {
    ctx.status = 410;
    ctx.body = {
      code: 410,
      message: '应用已卸载或已结束服务',
      data: {
        app: appName,
        status: runtimeApp.status,
        lifecycle: 'disposed'
      }
    };

    return null;
  }

  if (runtimeApp.status !== 'ready' || !hasRuntimeAppCapability(appName, capability)) {
    ctx.status = 404;
    ctx.body = {
      code: 404,
      message: '应用未提供对应服务能力',
      data: null
    };

    return null;
  }

  return runtimeApp;
};

const dispatchRegisteredKoaRouters = async (ctx: KoaRouter.RouterContext) => {
  const registeredRouters = listRuntimeAppKoaRouters();
  const candidates = new Set<string>(registeredRouters.map(item => item.name));
  const runtimeApps = listRuntimeApps();

  runtimeApps.forEach(item => {
    if (item.capabilities?.httpApi) {
      candidates.add(item.name);
    }
  });

  for (const appName of candidates) {
    const runtimeApp = getRuntimeApp(appName);

    if (!runtimeApp || !runtimeApp.enabled || runtimeApp.status !== 'ready' || !hasRuntimeAppCapability(appName, 'httpApi')) {
      continue;
    }

    const registerRouters = getChildrenApp(appName)?.register?.koaRouter;
    const storedRouters = getRuntimeAppKoaRouters(appName);
    const routers = (storedRouters.length ? storedRouters : Array.isArray(registerRouters) ? registerRouters : registerRouters ? [registerRouters] : []).filter(
      Boolean
    );
    const aliasBases = appName === 'main' ? ['', '/app'] : ['', `/apps/${appName}`];

    for (const koaRouter of routers) {
      for (const basePath of aliasBases) {
        const rewrittenPath = matchBasePath(ctx.path, basePath);

        if (!rewrittenPath) {
          continue;
        }

        try {
          const matchedContext = ctx as KoaRouter.RouterContext & { matched?: string[] };
          const beforeMatched = Array.isArray(matchedContext.matched) ? matchedContext.matched.length : 0;
          const beforeStatus = ctx.status;
          const beforeBody = ctx.body;
          const beforeMatchedRoute = (ctx as KoaRouter.RouterContext & { _matchedRoute?: string })._matchedRoute;
          const beforeRouterPath = (ctx as KoaRouter.RouterContext & { routerPath?: string }).routerPath;
          let fallthrough = false;

          await rewriteCtxPath(ctx, rewrittenPath, async () => {
            await koaRouter.routes()(ctx, async () => {
              fallthrough = true;
            });
          });

          const afterMatched = Array.isArray(matchedContext.matched) ? matchedContext.matched.length : 0;
          const afterMatchedRoute = (ctx as KoaRouter.RouterContext & { _matchedRoute?: string })._matchedRoute;
          const afterRouterPath = (ctx as KoaRouter.RouterContext & { routerPath?: string }).routerPath;
          const handled =
            afterMatched > beforeMatched ||
            afterMatchedRoute !== beforeMatchedRoute ||
            afterRouterPath !== beforeRouterPath ||
            ctx.status !== beforeStatus ||
            ctx.body !== beforeBody ||
            !fallthrough;

          if (!handled) {
            continue;
          }

          await rewriteCtxPath(ctx, rewrittenPath, async () => {
            await koaRouter.allowedMethods()(ctx, async () => {});
          });

          return true;
        } catch (error) {
          const handled = await dispatchHttpError({
            ctx,
            error,
            appName,
            path: ctx.path,
            method: ctx.method,
            kind: 'koa-router'
          });

          if (handled) {
            return true;
          }

          logger.warn({
            code: ResultCode.Fail,
            message: `Error request ${ctx.path}:`,
            data: error instanceof Error ? error.message : String(error)
          });
          ctx.status = 500;
          ctx.body = {
            code: 500,
            message: '处理 Koa Router 请求时发生错误。',
            error: error instanceof Error ? error.message : String(error)
          };

          return true;
        }
      }
    }
  }

  return false;
};

router.get('/', ctx => {
  ctx.status = 200;
  ctx.set('Content-Type', 'text/html; charset=utf-8');
  ctx.body = renderHelloHtml(listRuntimeApps());
});

// 响应服务在线
router.get('api/online', ctx => {
  ctx.status = 200;
  ctx.body = {
    code: 200,
    message: 'service online',
    data: null
  };
});

router.get('api/runtime/apps', ctx => {
  const status = String(ctx.query?.status ?? '').trim() as RuntimeAppStatus | '';
  const data = listRuntimeApps().filter(item => {
    if (!status) {
      return true;
    }

    return item.status === status;
  });

  ctx.status = 200;
  ctx.body = {
    code: 200,
    message: 'runtime apps',
    data
  };
});

router.get('api/runtime/apps/:app', ctx => {
  const appName = ctx.params.app;
  const runtimeApp = getRuntimeApp(appName);

  if (!runtimeApp) {
    ctx.status = 404;
    ctx.body = {
      code: 404,
      message: '应用未注册',
      data: null
    };

    return;
  }

  ctx.status = 200;
  ctx.body = {
    code: 200,
    message: 'runtime app',
    data: toRuntimeAppSnapshot(runtimeApp)
  };
});

router.use(async (ctx, next) => {
  const handled = await dispatchRegisteredKoaRouters(ctx);

  if (handled) {
    return;
  }

  await next();
});

const handleMainAppRequest = async (ctx: KoaRouter.RouterContext) => {
  if (!process.env.input) {
    ctx.status = 400;
    ctx.body = {
      code: 400,
      message: '没有主要入口文件',
      data: null
    };

    return;
  }
  const rootPath = process.cwd();

  const apiPath = '/app/api';

  if (ctx.path.startsWith(apiPath)) {
    const runtimeApp = denyRuntimeAppAccess(ctx, 'main', 'httpApi');

    if (!runtimeApp) {
      return;
    }
    const mainPath = join(rootPath, process.env.input);

    // 路径
    if (!existsSync(mainPath)) {
      ctx.status = 400;
      ctx.body = {
        code: 400,
        message: '未找到主要入口文件',
        data: 'existsSync input'
      };

      return;
    }
    const mainDir = dirname(mainPath);

    try {
      const routeBase = join(mainDir, 'route');
      const dir = safePath(routeBase, ctx.path?.replace(apiPath, '/api') || '');

      if (!dir) {
        ctx.status = 403;
        ctx.body = {
          code: 403,
          message: '非法路径',
          data: null
        };

        return;
      }

      // 检查路径是否存在且是文件（而不是目录）
      if (existsSync(dir) && fs.statSync(dir).isFile()) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: `API '${ctx.path}' 未找到。`,
          data: 'route path is file not directory'
        };

        return;
      }

      const modulePath = getModuelFile(dir);

      if (!modulePath) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: `API '${ctx.path}' 未找到。`,
          data: 'existsSync modulePath'
        };

        return;
      }
      const apiModule = await import(`file://${modulePath}`);
      const handler = apiModule[ctx.method];

      if (!handler || typeof handler !== 'function') {
        ctx.status = 405;

        return;
      }
      const middlewares = await collectMiddlewares(modulePath);

      await runMiddlewares(middlewares, ctx, handler);
    } catch (err) {
      const handled = await dispatchHttpError({
        ctx,
        error: err,
        appName: 'main',
        path: ctx.path,
        method: ctx.method,
        kind: 'api'
      });

      if (handled) {
        return;
      }

      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '处理 API 请求时发生错误。',
        error: err instanceof Error ? err.message : String(err)
      };
    }

    return;
  }
  // 如果不是 get请求。即不响应
  if (ctx.method !== 'GET') {
    ctx.status = 405;

    return;
  }
  let root = '';
  const resourcePath = formatPath(ctx.params?.path);
  const runtimeApp = denyRuntimeAppAccess(ctx, 'main', 'web');

  if (!runtimeApp) {
    return;
  }
  const packageRoot = resolvePackageRoot(runtimeApp.rootDir);

  try {
    root = readWebRootConfig(packageRoot);
  } catch (err) {
    const handled = await dispatchHttpError({
      ctx,
      error: err,
      appName: 'main',
      path: ctx.path,
      method: ctx.method,
      kind: 'web'
    });

    if (handled) {
      return;
    }

    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: '加载 package.json 时发生错误。',
      error: err instanceof Error ? err.message : String(err)
    };

    return;
  }
  const webRoot = root ? path.join(packageRoot, root) : packageRoot;
  const fullPath = safePath(webRoot, resourcePath);

  if (!fullPath) {
    ctx.status = 403;
    ctx.body = {
      code: 403,
      message: '非法路径',
      data: null
    };

    return;
  }

  try {
    // 返回文件
    const file = await fs.promises.readFile(fullPath);
    const mimeType = mime.lookup(fullPath) || 'application/octet-stream';

    ctx.set('Content-Type', mimeType); // 自动设置响应头
    ctx.body = file;
    ctx.status = 200;
  } catch (err) {
    const handled = await dispatchHttpError({
      ctx,
      error: err,
      appName: 'main',
      path: ctx.path,
      method: ctx.method,
      kind: 'web'
    });

    if (handled) {
      return;
    }

    if (err?.status === 404) {
      ctx.status = 404;
      ctx.body = {
        code: 404,
        message: '资源中未找到。',
        data: null
      };
    } else {
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '加载资源时发生服务器错误。',
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }
};

router.all('app', handleMainAppRequest);
router.all('app/', handleMainAppRequest);
router.all('app/{*path}', handleMainAppRequest);

const handlePluginAppRequest = async (ctx: KoaRouter.RouterContext) => {
  const appName = ctx.params.app;

  if (!isValidPackageName(appName)) {
    ctx.status = 400;
    ctx.body = {
      code: 400,
      message: '无效的应用名称',
      data: null
    };

    return;
  }

  const apiPath = `/apps/${appName}/api`;

  if (ctx.path.startsWith(apiPath)) {
    const runtimeApp = denyRuntimeAppAccess(ctx, appName, 'httpApi');

    if (!runtimeApp) {
      return;
    }
    try {
      const routeBase = join(runtimeApp.rootDir, 'route');
      const dir = safePath(routeBase, ctx.path?.replace(apiPath, '/api') || '');

      if (!dir) {
        ctx.status = 403;
        ctx.body = {
          code: 403,
          message: '非法路径',
          data: null
        };

        return;
      }

      // 检查路径是否存在且是文件（而不是目录）
      if (existsSync(dir) && fs.statSync(dir).isFile()) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: `API 'route/${ctx.path}' 未找到。`,
          data: 'route path is file not directory'
        };

        return;
      }

      const modulePath = getModuelFile(dir);

      if (!modulePath) {
        ctx.status = 404;
        ctx.body = {
          code: 404,
          message: `API '${ctx.path}' 未找到。`,
          data: 'existsSync modulePath'
        };

        return;
      }
      const apiModule = await import(`file://${modulePath}`);
      const handler = apiModule[ctx.method];

      if (!handler || typeof handler !== 'function') {
        ctx.status = 405;

        return;
      }
      const middlewares = await collectMiddlewares(modulePath);

      await runMiddlewares(middlewares, ctx, handler);
    } catch (err) {
      const handled = await dispatchHttpError({
        ctx,
        error: err,
        appName,
        path: ctx.path,
        method: ctx.method,
        kind: 'api'
      });

      if (handled) {
        return;
      }

      logger.warn({
        code: ResultCode.Fail,
        message: `Error request ${ctx.path}:`,
        data: err instanceof Error ? err.message : String(err)
      });
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '处理 API 请求时发生错误。',
        error: err instanceof Error ? err.message : String(err)
      };
    }

    return;
  }

  // 如果不是 get请求。即不响应
  if (ctx.method !== 'GET') {
    ctx.status = 405;

    return;
  }
  // 不是 packages，而是 node_modules。需要是模块化
  const runtimeApp = denyRuntimeAppAccess(ctx, appName, 'web');

  if (!runtimeApp) {
    return;
  }
  const packageRoot = resolvePackageRoot(runtimeApp.rootDir);
  const resourcePath = formatPath(ctx.params?.path);
  let root = '';

  try {
    root = readWebRootConfig(packageRoot);
  } catch (err) {
    const handled = await dispatchHttpError({
      ctx,
      error: err,
      appName,
      path: ctx.path,
      method: ctx.method,
      kind: 'web'
    });

    if (handled) {
      return;
    }

    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: '加载 package.json 时发生错误。',
      error: err instanceof Error ? err.message : String(err)
    };

    return;
  }
  const webRoot = root ? path.join(packageRoot, root) : packageRoot;
  const fullPath = safePath(webRoot, resourcePath);

  if (!fullPath) {
    ctx.status = 403;
    ctx.body = {
      code: 403,
      message: '非法路径',
      data: null
    };

    return;
  }

  try {
    // 返回文件
    const file = await fs.promises.readFile(fullPath);
    const mimeType = mime.lookup(fullPath) || 'application/octet-stream';

    ctx.set('Content-Type', mimeType); // 自动设置响应头
    ctx.body = file;
    ctx.status = 200;
  } catch (err) {
    const handled = await dispatchHttpError({
      ctx,
      error: err,
      appName,
      path: ctx.path,
      method: ctx.method,
      kind: 'web'
    });

    if (handled) {
      return;
    }

    if (err?.status === 404) {
      ctx.status = 404;
      ctx.body = {
        code: 404,
        message: `资源 '${resourcePath}' 在子应用 '${appName}' 中未找到。`,
        data: null
      };
    } else {
      logger.warn({
        code: ResultCode.Fail,
        message: `Error request ${ctx.path}:`,
        data: err instanceof Error ? err.message : String(err)
      });
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: `加载子应用 '${appName}' 资源时发生服务器错误。`,
        error: err instanceof Error ? err.message : String(err)
      };
    }
  }
};

router.all('apps/:app', handlePluginAppRequest);
router.all('apps/:app/', handlePluginAppRequest);
router.all('apps/:app/{*path}', handlePluginAppRequest);

export { router as default };
