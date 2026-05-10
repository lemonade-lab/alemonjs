const COMMAND_PREFIX_REGEXP = /^([!！/#＃])\s*/;

export type ParsedMessage = {
  prefix: string;
  rawText: string;
  normalizedText: string;
  tokens: string[];
};

export function parseMessageText(messageText?: string): ParsedMessage | null {
  const rawText = String(messageText ?? '').trim();

  if (!rawText) {
    return null;
  }

  const prefixMatch = rawText.match(COMMAND_PREFIX_REGEXP);
  const prefix = prefixMatch?.[1] ?? '';
  const normalizedText = rawText.replace(COMMAND_PREFIX_REGEXP, '').trim();

  if (!normalizedText) {
    return null;
  }

  return {
    prefix,
    rawText,
    normalizedText,
    tokens: normalizedText.split(/\s+/).filter(Boolean)
  };
}

export function normalizeRoutePath(path: string) {
  return path.replace(COMMAND_PREFIX_REGEXP, '').trim();
}
