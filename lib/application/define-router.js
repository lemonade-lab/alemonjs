//#region src/application/define-router.ts
/**
* Lazy load a response handler
* @param fnc
* @returns
*/
const lazy = (fnc) => {
	let c = null;
	const back = async () => {
		if (c) return c;
		const mod = await fnc();
		if (!mod || !mod.default) {}
		c = mod.default;
		return c;
	};
	return back;
};
/**
* 手动执行一个动态导入的 handler
* @param loader 动态导入函数 `() => import('./response/xxx')`
* @param args handler 的参数数组 `[event, next]`
*/
async function runHandler(loader, args) {
	const mod = await loader();
	return (mod.default ?? mod)(...args);
}
/**
* 定义路由
* 与 defineResponse 类似，但路由处理器是纯异步函数组件，
* 内部自动根据 selects 来分类。
* @param routes 路由配置数组
* @returns
*/
const defineRouter = (routes) => {
	return { current: routes };
};
global.defineRouter = defineRouter;

//#endregion
export { defineRouter, lazy, runHandler };