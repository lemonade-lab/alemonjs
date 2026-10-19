//#region src/core/cbp/server/main.d.ts
/**
 * CBP 服务器
 * @param port
 * @param listeningListener
 */
declare const cbpServer: (port: number, listeningListener?: (port: number) => void, autoPort?: boolean) => void;
//#endregion
export { cbpServer };