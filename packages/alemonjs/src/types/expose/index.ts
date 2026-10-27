/** JSON Schema 的明确子集；注册时拒绝不支持的关键字，不静默忽略约束。 */
export type ExposeValueSchema =
  | { type: 'null'; description?: string }
  | { type: 'boolean'; description?: string }
  | { type: 'string'; description?: string; enum?: string[]; minLength?: number; maxLength?: number }
  | { type: 'number' | 'integer'; description?: string; minimum?: number; maximum?: number }
  | { type: 'array'; description?: string; items: ExposeValueSchema; minItems?: number; maxItems?: number }
  | { type: 'object'; description?: string; properties: Record<string, ExposeValueSchema>; required?: string[]; additionalProperties: false };

export interface ExposeCallContext {
  readonly callId: string;
  readonly parentCallId?: string;
  /** 框架调用上下文识别的调用方；无插件上下文时为空，不接受模型指定。 */
  readonly callerApp?: string;
  readonly protocol: string;
  readonly provider: string;
  readonly action: string;
  readonly signal: AbortSignal;
}

export type ExposeReadonly<T> = T extends object ? { readonly [Key in keyof T]: ExposeReadonly<T[Key]> } : T;

export interface ExposeActionMeta<Input = any, Output = any> {
  description: string;
  /** 旧版文字说明，不能代替运行时契约。 */
  params?: Record<string, string>;
  returns?: Record<string, string>;
  inputSchema?: ExposeValueSchema;
  outputSchema?: ExposeValueSchema;
  effect?: 'read' | 'write' | 'unknown';
  /** 授权始终在执行前检查；不应只依赖 AI 看见的目录。 */
  authorize?: (input: ExposeReadonly<Input>, context: ExposeCallContext) => boolean | Promise<boolean>;
  handler: (input: Input, context: ExposeCallContext) => Output | Promise<Output>;
}

export interface ExposeProvideConfig {
  name: string;
  description: string;
  version?: string;
  actions: Record<string, ExposeActionMeta>;
}

export type ExposeActionDescription = Pick<ExposeActionMeta, 'description' | 'params' | 'returns' | 'inputSchema' | 'outputSchema' | 'effect'>;

export interface ExposeListItem {
  name: string;
  protocol: string;
  description: string;
  version?: string;
  actions: Record<string, ExposeActionDescription>;
  invoke: (action: string, value?: any) => any;
}

/** 兼容旧版：仅在动作成功返回且通过输出校验后通知，不代表数据库提交保证。 */
export interface ExposeWatchEvent {
  name: string;
  protocol: string;
  action: string;
  value?: any;
}

/** 每个 provider 独立描述；不再借用同协议的第一个 provider 的契约。 */
export interface ExposeSchemaItem {
  protocol: string;
  description: string;
  version?: string;
  providers: { name: string }[];
  actions: Record<string, ExposeActionDescription>;
  invoke: string;
}

export type ExposeErrorCode =
  | 'PROTOCOL_NOT_FOUND'
  | 'PROVIDER_NOT_FOUND'
  | 'ACTION_NOT_FOUND'
  | 'STALE_PROVIDER'
  | 'CONTRACT_REQUIRED'
  | 'INVALID_INPUT'
  | 'INVALID_OUTPUT'
  | 'FORBIDDEN'
  | 'HANDLER_FAILED'
  | 'ABORTED'
  | 'TIMEOUT'
  | 'INVALID_OPTIONS';

export interface ExposeCallOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
}

export type ExposeCallResult =
  | { ok: true; callId: string; data: unknown }
  | { ok: false; callId: string; error: { code: ExposeErrorCode; message: string; outcome: 'not_started' | 'unknown' } };
