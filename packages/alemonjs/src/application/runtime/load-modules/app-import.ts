import { realpathSync } from 'node:fs';
import module from 'node:module';
import { isAbsolute, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { scopedMap } from '../../../common/runtime-scope.js';

type Resolution = { url: string; format?: string | null };
type RegisterHooks = (hooks: {
  resolve: (specifier: string, context: { parentURL?: string }, next: (specifier: string, context: unknown) => Resolution) => Resolution;
}) => unknown;

const generationKey = '__alemonjs_app_generation';
const roots = new Map<string, string>();
const generations = scopedMap<string, string>();
let nextGeneration = 0;
let hooksRegistered = false;

export const prepareAppGeneration = (appName: string, rootDir: string) => {
  if (!hooksRegistered) {
    const registerHooks = (module as typeof module & { registerHooks?: RegisterHooks }).registerHooks;

    if (!registerHooks) {
      throw new Error('Application hot reload requires Node.js 22.15 or newer with module.registerHooks');
    }
    registerHooks({
      resolve(specifier, context, next) {
        const resolved = next(specifier, context);

        if (!resolved.url.startsWith('file:') || !context.parentURL?.startsWith('file:')) {
          return resolved;
        }
        const parentURL = context.parentURL;

        if (!resolved.url.includes(generationKey) && !parentURL.includes(generationKey)) {
          return resolved;
        }
        const url = new URL(resolved.url);
        const generation = url.searchParams.get(generationKey) ?? new URL(parentURL).searchParams.get(generationKey);
        const root = roots.get(generation);

        if (!root) {
          return resolved;
        }
        const path = relative(root, fileURLToPath(url));

        if (isAbsolute(path) || path.split(sep).some(part => part === '..' || part === 'node_modules')) {
          return resolved;
        }
        if (resolved.format?.startsWith('commonjs') || url.pathname.endsWith('.cjs')) {
          throw new Error('Application hot reload requires ESM for package code: ' + fileURLToPath(url));
        }

        url.searchParams.set(generationKey, generation);

        return { ...resolved, url: url.href };
      }
    });
    hooksRegistered = true;
  }

  const root = realpathSync(rootDir);
  const generation = String(++nextGeneration);

  roots.set(generation, root);

  return () => generations.set(appName, generation);
};

export const getAppGeneration = (appName: string) => generations.get(appName);

export const importAppFile = (path: string, generation?: string) => {
  const url = pathToFileURL(path);

  if (generation) {
    url.searchParams.set(generationKey, generation);
  }

  return import(url.href);
};
