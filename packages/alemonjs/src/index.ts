// 导出类型
export * from './types/index.js';
// 导出全局变量
export * from './global.js';
// 导出内部模块
export * from './app/define-chidren.js';
export * from './app/define-response.js';
export * from './app/define-middleware.js';
export * from './app/event-group.js';
export * from './app/event-middleware';
export * from './app/event-processor';
export * from './app/event-response.js';
export * from './app/event-processor-cycle.js';
export * from './app/event-processor-event.js';
export * from './app/event-processor-middleware.js';
export * from './app/event-processor-subscribe.js';
export * from './app/hook-use-api.js';
export * from './app/hook-use-state';
export * from './app/hook-use-subscribe.js';
export * from './app/load.js';
export * from './app/message-api.js';
export * from './app/message-format.js';
export * from './app/store.js';
// core
export * from './core/index.js';
// cbp
export * from './cbp/index.js';
// 导出主要模块
export * from './main.js';

['SIGINT', 'SIGTERM', 'SIGQUIT', 'disconnect'].forEach(sig => {
  process?.on?.(sig, () => {
    setImmediate(() => process.exit(0));
  });
});

process?.on?.('exit', code => {
  logger?.info?.(`[alemonjs][exit] 进程退出，code=${code}`);
});
