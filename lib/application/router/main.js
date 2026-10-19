import { normalizeRoutePath, parseMessageText } from "./parser.js";
import { checkFallbackHint } from "./fallback.js";
import { validateRouteArgs } from "./validator.js";
import { Router } from "./dsl.js";

export { Router, checkFallbackHint, normalizeRoutePath, parseMessageText, validateRouteArgs };