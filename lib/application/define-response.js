//#region src/application/define-response.ts
const defineResponse = (responses) => {
	return { current: responses };
};
global.defineResponse = defineResponse;

//#endregion
export { defineResponse };