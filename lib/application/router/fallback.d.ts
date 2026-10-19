//#region src/application/router/fallback.d.ts
type FallbackHint = {
  matched: boolean;
  message?: string;
  suggestedKey?: string;
};
type FallbackSuggestOptions = {
  suggest?: boolean;
  maxDistance?: number;
  minInputLength?: number;
  allowPrefixMatch?: boolean;
};
declare function checkFallbackHint(messageText: string | undefined, routeKeys: string[], options?: FallbackSuggestOptions): FallbackHint;
//#endregion
export { FallbackHint, FallbackSuggestOptions, checkFallbackHint };