import { Expose, type ExposeCallResult, type ExposeValueSchema } from '../lib/index.js';
const amount: ExposeValueSchema = { type: 'integer', minimum: 1, maximum: 100 };
const read = Expose.action<{ amount: number }, { count: number }>({
  description: 'Read count',
  inputSchema: { type: 'object', properties: { amount }, required: ['amount'], additionalProperties: false },
  outputSchema: { type: 'object', properties: { count: amount }, required: ['count'], additionalProperties: false },
  effect: 'read',
  authorize: (input, context) => {
    // @ts-expect-error Authorization cannot rewrite arguments.
    input.amount = 99;
    return context.callerApp === 'consumer';
  },
  handler: (input, context) => {
    const signal: AbortSignal = context.signal;
    void signal;
    // @ts-expect-error Context identity is immutable.
    context.callerApp = 'other';
    return { count: input.amount };
  }
});
const expose = Expose.create().provide({ name: 'sample', description: 'Sample', actions: { read } });
const result: Promise<ExposeCallResult> = expose.call('sample', 'provider', 'read', { amount: 1 });
void result;
// @ts-expect-error Object schemas must explicitly reject undeclared fields.
const unsafe: ExposeValueSchema = { type: 'object', properties: {} };
void unsafe;
