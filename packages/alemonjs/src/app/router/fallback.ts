import { parseMessageText } from './parser';

export type FallbackHint = {
  matched: boolean;
  message?: string;
  suggestedKey?: string;
};

export type FallbackSuggestOptions = {
  suggest?: boolean;
  maxDistance?: number;
  minInputLength?: number;
  allowPrefixMatch?: boolean;
};

function levenshteinDistance(a: string, b: string) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (let col = 0; col < cols; col += 1) {
    matrix[0][col] = col;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1;

      matrix[row][col] = Math.min(matrix[row - 1][col] + 1, matrix[row][col - 1] + 1, matrix[row - 1][col - 1] + cost);
    }
  }

  return matrix[a.length][b.length];
}

function normalizeForCompare(text: string) {
  return text.replace(/^([!！/#＃])\s*/, '').trim();
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function shouldCheckCandidate(messageText: string, candidate: string) {
  if (!messageText || !candidate) {
    return false;
  }

  const candidatePattern = new RegExp(`^${escapeRegExp(candidate)}(?:\\s|$)`);

  return candidatePattern.test(messageText);
}

function getAdaptiveMaxDistance(input: string) {
  if (input.length <= 2) {
    return 1;
  }

  if (input.length <= 4) {
    return 2;
  }

  return 3;
}

function shouldAcceptSuggestion(input: string, candidate: string, distance: number, options: FallbackSuggestOptions = {}) {
  if (input === candidate) {
    return false;
  }

  if (options.allowPrefixMatch !== false && (candidate.startsWith(input) || input.startsWith(candidate))) {
    return true;
  }

  const maxDistance = typeof options.maxDistance === 'number' ? options.maxDistance : getAdaptiveMaxDistance(input);

  return distance <= maxDistance;
}

export function checkFallbackHint(messageText: string | undefined, routeKeys: string[], options: FallbackSuggestOptions = {}): FallbackHint {
  if (options.suggest === false) {
    return { matched: false };
  }

  const normalizedMessage = normalizeForCompare(String(messageText ?? ''));

  if (!normalizedMessage) {
    return { matched: false };
  }

  const parsed = parseMessageText(messageText);

  if (!parsed) {
    return { matched: false };
  }

  const oneKey = parsed.tokens[0] ?? '';
  const twoKey = parsed.tokens.length >= 2 ? `${parsed.tokens[0]} ${parsed.tokens[1]}` : '';
  const attemptedKey = twoKey || oneKey;

  if (!attemptedKey) {
    return { matched: false };
  }

  if (typeof options.minInputLength === 'number' && attemptedKey.length < options.minInputLength) {
    return { matched: false };
  }

  let bestMatch: { key: string; distance: number } | null = null;

  for (const routeKey of routeKeys) {
    const normalizedKey = normalizeForCompare(routeKey);

    if (!shouldCheckCandidate(normalizedMessage, normalizedKey)) {
      continue;
    }

    const distance = levenshteinDistance(attemptedKey, normalizedKey);

    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = {
        key: routeKey,
        distance
      };
    }
  }

  if (!bestMatch) {
    return { matched: false };
  }

  const normalizedBestKey = normalizeForCompare(bestMatch.key);

  if (!shouldAcceptSuggestion(attemptedKey, normalizedBestKey, bestMatch.distance, options)) {
    return { matched: false };
  }

  return {
    matched: true,
    suggestedKey: bestMatch.key,
    message: `你输入的内容更接近指令 \`${bestMatch.key}\`，请改用这个指令。`
  };
}
