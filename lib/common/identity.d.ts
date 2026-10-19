//#region src/common/identity.d.ts
declare const matchIn: (source: any, key: string) => boolean;
declare const fastHash: (str: string) => string;
declare const createUserHashKey: (event: {
  UserId: string;
  Platform: string;
}) => string;
/**
 * @deprecated 已废弃，请直接使用 useUserHashKey
 */
declare const useUserHashKey: typeof createUserHashKey;
declare const isMaster: (UserId: string, platform: string) => boolean;
//#endregion
export { createUserHashKey, fastHash, isMaster, matchIn, useUserHashKey };