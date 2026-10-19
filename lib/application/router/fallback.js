import { translate } from "../../common/i18n.js";
import { parseMessageText } from "./parser.js";

//#region src/application/router/fallback.ts
function levenshteinDistance(a, b) {
	const rows = a.length + 1;
	const cols = b.length + 1;
	const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));
	for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
	for (let col = 0; col < cols; col += 1) matrix[0][col] = col;
	for (let row = 1; row < rows; row += 1) for (let col = 1; col < cols; col += 1) {
		const cost = a[row - 1] === b[col - 1] ? 0 : 1;
		matrix[row][col] = Math.min(matrix[row - 1][col] + 1, matrix[row][col - 1] + 1, matrix[row - 1][col - 1] + cost);
	}
	return matrix[a.length][b.length];
}
function normalizeForCompare(text) {
	return text.replace(/^([!！/#＃])\s*/, "").trim();
}
function escapeRegExp(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function shouldCheckCandidate(messageText, candidate) {
	if (!messageText || !candidate) return false;
	return new RegExp(`^${escapeRegExp(candidate)}(?:\\s|$)`).test(messageText);
}
function getAdaptiveMaxDistance(input) {
	if (input.length <= 2) return 1;
	if (input.length <= 4) return 2;
	return 3;
}
function shouldAcceptSuggestion(input, candidate, distance, options = {}) {
	if (input === candidate) return false;
	if (options.allowPrefixMatch !== false && (candidate.startsWith(input) || input.startsWith(candidate))) return true;
	return distance <= (typeof options.maxDistance === "number" ? options.maxDistance : getAdaptiveMaxDistance(input));
}
function checkFallbackHint(messageText, routeKeys, options = {}) {
	if (options.suggest === false) return { matched: false };
	const normalizedMessage = normalizeForCompare(String(messageText ?? ""));
	if (!normalizedMessage) return { matched: false };
	const parsed = parseMessageText(messageText);
	if (!parsed) return { matched: false };
	const oneKey = parsed.tokens[0] ?? "";
	const attemptedKey = (parsed.tokens.length >= 2 ? `${parsed.tokens[0]} ${parsed.tokens[1]}` : "") || oneKey;
	if (!attemptedKey) return { matched: false };
	if (typeof options.minInputLength === "number" && attemptedKey.length < options.minInputLength) return { matched: false };
	let bestMatch = null;
	for (const routeKey of routeKeys) {
		const normalizedKey = normalizeForCompare(routeKey);
		if (!shouldCheckCandidate(normalizedMessage, normalizedKey)) continue;
		const distance = levenshteinDistance(attemptedKey, normalizedKey);
		if (!bestMatch || distance < bestMatch.distance) bestMatch = {
			key: routeKey,
			distance
		};
	}
	if (!bestMatch) return { matched: false };
	if (!shouldAcceptSuggestion(attemptedKey, normalizeForCompare(bestMatch.key), bestMatch.distance, options)) return { matched: false };
	return {
		matched: true,
		suggestedKey: bestMatch.key,
		message: translate("fallback.closest", { command: bestMatch.key })
	};
}

//#endregion
export { checkFallbackHint };