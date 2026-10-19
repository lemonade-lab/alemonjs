//#region src/application/router/parser.d.ts
type ParsedMessage = {
  prefix: string;
  rawText: string;
  normalizedText: string;
  tokens: string[];
};
declare function parseMessageText(messageText?: string): ParsedMessage | null;
declare function normalizeRoutePath(path: string): string;
//#endregion
export { ParsedMessage, normalizeRoutePath, parseMessageText };