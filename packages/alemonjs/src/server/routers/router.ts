import KoaRouter from 'koa-router';
import fs, { existsSync } from 'fs';
import path, { join, dirname } from 'path';
import mime from 'mime-types';
import hello from './hello.html';
import { formatPath, getModuelFile, safePath, isValidPackageName } from './utils';
import { collectMiddlewares, runMiddlewares } from './middleware';
import { ResultCode } from 'core';
import module from 'module';

const initRequire = () => {};

initRequire.resolve = () => '';
const require = module?.createRequire?.(import.meta.url) ?? initRequire;
const mainDirMap = new Map();

const router = new KoaRouter({
  prefix: '/'
});

router.get('/', ctx => {
  ctx.status = 200;
  ctx.set('Content-Type', 'text/html; charset=utf-8');
  ctx.body = hello;
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

router.all('app/{*path}', async ctx => {
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
      console.error(`Error handling API request ${ctx.path}`);
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '处理 API 请求时发生错误。',
        error: err.message
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

  try {
    const pkg = require(path.join(rootPath, 'package.json')) ?? {};

    root = pkg.alemonjs?.web?.root ?? '';
  } catch (err) {
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: '加载 package.json 时发生错误。',
      error: err.message
    };

    return;
  }
  const webRoot = root ? path.join(rootPath, root) : rootPath;
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
        error: err.message
      };
    }
  }
});

router.all('app', ctx => {
  ctx.redirect('/app/');
});

router.all('apps/:app/{*path}', async ctx => {
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
    try {
      if (!mainDirMap.has(appName)) {
        const mainPath = require.resolve(appName);

        // 不存在 main
        if (!existsSync(mainPath)) {
          ctx.status = 400;
          ctx.body = {
            code: 400,
            message: '未找到主要入口文件',
            data: null
          };

          return;
        }
        const mainDir = dirname(mainPath);

        mainDirMap.set(appName, mainDir);
      }
      const routeBase = join(mainDirMap.get(appName), 'route');
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
      logger.warn({
        code: ResultCode.Fail,
        message: `Error request ${ctx.path}:`,
        data: err?.message ?? ''
      });
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: '处理 API 请求时发生错误。',
        error: err.message
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
  const rootPath = path.join(process.cwd(), 'node_modules', appName);
  const resourcePath = formatPath(ctx.params?.path);
  let root = '';

  try {
    const pkg = require(`${appName}/package`) ?? {};

    root = pkg?.alemonjs?.web?.root ?? '';
  } catch (err) {
    ctx.status = 500;
    ctx.body = {
      code: 500,
      message: '加载 package.json 时发生错误。',
      error: err.message
    };

    return;
  }
  const webRoot = root ? path.join(rootPath, root) : rootPath;
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
        data: err?.message ?? ''
      });
      ctx.status = 500;
      ctx.body = {
        code: 500,
        message: `加载子应用 '${appName}' 资源时发生服务器错误。`,
        error: err.message
      };
    }
  }
});
router.all('apps/:name', ctx => {
  if (ctx.path === `/apps/${ctx.params.name}`) {
    ctx.redirect(`/apps/${ctx.params.name}/`);
  }
});

export { router as default };
