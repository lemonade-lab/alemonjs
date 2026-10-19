//#region src/application/runtime/event-group.ts
/**
* 定义一组标准执行导出
* @param calls
* @deprecated 废弃
* @returns
*/
const onGroup = (...calls) => {
	if (calls.length === 0) throw new Error("onGroup: 至少需要一个响应或中间件");
	return {
		select: calls[0].select,
		current: calls.reduce((acc, item) => {
			if (Array.isArray(item.current)) return acc.concat(item.current);
			else return acc.concat(item.current);
		}, [])
	};
};
global.onGroup = onGroup;

//#endregion
export { onGroup };