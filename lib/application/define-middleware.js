//#region src/application/define-middleware.ts
const defineMiddleware = (middleware) => {
	return { current: middleware };
};
global.defineMiddleware = defineMiddleware;

//#endregion
export { defineMiddleware };