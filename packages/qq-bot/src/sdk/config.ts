/** Per-bot mutable runtime state. Never share this object between bot instances. */
export class QQBotConfig extends Map<string, any> {
  constructor(value: Record<string, unknown> = {}) {
    super(Object.entries(value));
  }
}
