export type CommandConfig = {
  prefix: string;
  space?: boolean;
  format?: { enabled?: boolean; match?: string; replacement?: string };
};

export function validateCommandConfig(value: unknown, name: string): asserts value is CommandConfig {
  const fail = () => {
    throw new Error(`[apps] ${name}: invalid command configuration`);
  };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail();
  const c = value as CommandConfig;
  if (typeof c.prefix !== 'string' || !c.prefix || /\s/.test(c.prefix)) fail();
  if (c.space !== undefined && typeof c.space !== 'boolean') fail();
  if (c.format !== undefined) {
    const f = c.format;
    if (!f || typeof f !== 'object' || Array.isArray(f)) return fail();
    if (f.enabled !== undefined && typeof f.enabled !== 'boolean') fail();
    if (f.replacement !== undefined && typeof f.replacement !== 'string') fail();
    if (f.match !== undefined && typeof f.match !== 'string') fail();
    if (f.enabled && !f.match) fail();
    if (f.match !== undefined) {
      try {
        new RegExp(f.match);
      } catch {
        fail();
      }
    }
  }
}
