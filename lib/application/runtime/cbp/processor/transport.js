//#region src/application/runtime/cbp/processor/transport.ts
let _directSend = null;
/**
* 设置直连通道的发送函数
*/
const setDirectSend = (fn) => {
	_directSend = fn;
};
/**
* 获取直连通道的发送函数（null 表示直连不可用，回退 IPC/WS）
*/
const getDirectSend = () => _directSend;

//#endregion
export { getDirectSend, setDirectSend };