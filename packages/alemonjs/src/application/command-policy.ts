import { getConfigValue } from '../common/config.js';
import { validateCommandConfig, type CommandConfig } from '../common/command-config.js';
import { getCurrentAppName } from './runtime/hook-event-context.js';

export function getCommandPolicy(name = getCurrentAppName()): CommandConfig | undefined {
  if (!name) return;
  const apps = getConfigValue().apps;
  if (!apps || Array.isArray(apps) || !Object.hasOwn(apps, name)) return;
  const entry = apps[name];
  if (!entry || typeof entry !== 'object' || entry.enabled === false || entry.command === undefined) return;
  validateCommandConfig(entry.command, name);
  return entry.command;
}

export function forcedRouteText() {
  const policy = getCommandPolicy();
  return policy ? { prefixes: [policy.prefix], space: policy.space ?? false, stripPrefix: true, allowBare: false } : undefined;
}

/** Only traverse structured message values; never rewrite raw platform payloads. */
export function transformCommandButtons<T>(value: T): T {
  if (Array.isArray(value)) return value.map(item => transformCommandButtons(item)) as T;
  if (!value || typeof value !== 'object') return value;
  const node = value as Record<string, any>;
  const copy = { ...node };
  if ('value' in node && typeof node.value === 'object') copy.value = transformCommandButtons(node.value);
  if ((node.type === 'Button' || node.type === 'MD.button') && node.options) {
    const { commandTarget, ...options } = node.options;
    copy.options = options;
    if (commandTarget !== false && (options.type === undefined || options.type === 'command') && typeof options.data === 'string') {
      const policy = getCommandPolicy(typeof commandTarget === 'string' ? commandTarget : undefined);
      const format = policy?.format;
      if (policy && format?.enabled && format.match) {
        const regex = new RegExp(format.match);
        const match = regex.exec(options.data);
        // Even unanchored patterns may only transform the beginning of a command.
        if (match?.index === 0) {
          const body = options.data.replace(regex, format.replacement ?? '');
          if (body) options.data = policy.prefix + (policy.space ? ' ' : '') + body;
        }
      }
    }
  }
  return copy as T;
}

/** Framework-generated command hints use the same public prefix as input. */
export function formatPolicyCommand(command?: string): string | undefined {
  if (!command) return command;
  const policy = getCommandPolicy();
  if (!policy) return command;
  return policy.prefix + (policy.space ? ' ' : '') + command.replace(/^[!！/#＃]\s*/, '');
}
