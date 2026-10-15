import { after } from 'node:test';
// Framework configuration normally watches the working directory. Unit/integration
// tests use an isolated in-memory configuration and explicitly flush log writers.
globalThis.__client_loaded = true;
globalThis.__platform_bootstrap_loaded = true;
globalThis.__config = { value: {}, argv: {}, onWatch: () => () => {}, dispose() {} };
after(async () => {
  const { shutdownLogger } = await import('alemonjs/common');
  await shutdownLogger();
});
