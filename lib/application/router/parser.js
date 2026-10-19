//#region src/application/router/parser.ts
const COMMAND_PREFIX_REGEXP = /^([!！/#＃])\s*/;
function parseMessageText(messageText) {
	const rawText = String(messageText ?? "").trim();
	if (!rawText) return null;
	const prefix = rawText.match(COMMAND_PREFIX_REGEXP)?.[1] ?? "";
	const normalizedText = rawText.replace(COMMAND_PREFIX_REGEXP, "").trim();
	if (!normalizedText) return null;
	return {
		prefix,
		rawText,
		normalizedText,
		tokens: normalizedText.split(/\s+/).filter(Boolean)
	};
}
function normalizeRoutePath(path) {
	return path.replace(COMMAND_PREFIX_REGEXP, "").trim();
}

//#endregion
export { normalizeRoutePath, parseMessageText };