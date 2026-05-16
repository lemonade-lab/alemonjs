export type RouteRangeValue = {
  start: number;
  end: number;
};

export type SchemaValueType = 'string' | 'number' | 'enum' | 'range' | 'rest';
export type RouteSchemaValue = string | number | RouteRangeValue;

export type RouteRuleValidatorContext = {
  commandPath?: string;
  argName: string;
  argIndex: number;
  displayIndex: number;
  rawArgs: string[];
  parsedArgs: RouteSchemaValue[];
  rawValue: string;
};

export type RouteRule = {
  required?: boolean;
  type?: SchemaValueType;
  enum?: string[];
  pattern?: RegExp;
  min?: number;
  max?: number;
  separators?: string[];
  normalizeMap?: Record<string, string>;
  message?: string;
  validator?: (value: RouteSchemaValue, context: RouteRuleValidatorContext) => string | undefined;
};

export type RouteArgSchema = {
  name: string;
  description?: string;
  defaultValue?: RouteSchemaValue;
  rules?: RouteRule[];
};

export type RouteSchema = {
  args?: RouteArgSchema[];
  usage?: string;
  messages?: {
    tooFewArgs?: string;
    tooManyArgs?: string;
  };
};

export type RouteValidationResult =
  | {
      valid: true;
      parsedArgs: RouteSchemaValue[];
    }
  | {
      valid: false;
      error: string;
      usage?: string;
    };

function getRequiredRule(arg?: RouteArgSchema) {
  return arg?.rules?.find(rule => rule.required);
}

function getRestRule(arg?: RouteArgSchema) {
  return arg?.rules?.find(rule => rule.type === 'rest');
}

function getMinArgs(schema?: RouteSchema) {
  if (!schema) {
    return 0;
  }

  return (schema.args ?? []).filter(arg => Boolean(getRequiredRule(arg))).length;
}

function getMaxArgs(schema?: RouteSchema) {
  if (!schema) {
    return undefined;
  }

  const args = schema.args ?? [];

  if (args.some(arg => Boolean(getRestRule(arg)))) {
    return undefined;
  }

  return args.length > 0 ? args.length : undefined;
}

function getMissingRequiredArg(rawArgs: string[], schema?: RouteSchema) {
  const args = schema?.args ?? [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const requiredRule = getRequiredRule(arg);

    if (!requiredRule) {
      continue;
    }

    const rawValue = arg.rules?.some(rule => rule.type === 'rest') ? rawArgs.slice(index).join(' ').trim() : rawArgs[index];

    if (rawValue === undefined || rawValue === '') {
      return {
        arg,
        displayIndex: index + 1
      };
    }
  }

  return null;
}

function parseRange(rawValue: string, rule: RouteRule) {
  const separators = rule.separators ?? ['-', '－'];
  const separator = separators.find(item => rawValue.includes(item));

  if (!separator) {
    return null;
  }

  const [rawStart = '', rawEnd = ''] = rawValue.split(separator).map(item => item.trim());
  const start = Number(rawStart);
  const end = Number(rawEnd);

  if (!rawStart || !rawEnd || Number.isNaN(start) || Number.isNaN(end)) {
    return null;
  }

  return { start, end };
}

function formatArgReference(argName: string | undefined, displayIndex: number) {
  const name = String(argName ?? '').trim();

  if (name) {
    return `参数「${name}」`;
  }

  return `第${displayIndex}个参数`;
}

function validateTypedRule(rawValue: string, rule: RouteRule, context: RouteRuleValidatorContext, usage?: string): RouteValidationResult {
  const messagePrefix = formatArgReference(context.argName, context.displayIndex);
  const normalizedValue = rule.normalizeMap?.[rawValue] ?? rawValue;

  if (rule.pattern) {
    rule.pattern.lastIndex = 0;

    if (!rule.pattern.test(normalizedValue)) {
      return {
        valid: false,
        error: rule.message ?? `${messagePrefix}格式不正确`,
        usage
      };
    }
  }

  if (!rule.type || rule.type === 'string') {
    const value = String(normalizedValue);

    if (rule.validator) {
      const customError = rule.validator(value, { ...context, rawValue: normalizedValue });

      if (customError) {
        return {
          valid: false,
          error: customError,
          usage
        };
      }
    }

    return {
      valid: true,
      parsedArgs: [value]
    };
  }

  if (rule.type === 'number') {
    const value = Number(normalizedValue);

    if (Number.isNaN(value)) {
      return {
        valid: false,
        error: rule.message ?? `${messagePrefix}必须是数字`,
        usage
      };
    }

    if (typeof rule.min === 'number' && value < rule.min) {
      return {
        valid: false,
        error: rule.message ?? `${messagePrefix}不能小于${rule.min}`,
        usage
      };
    }

    if (typeof rule.max === 'number' && value > rule.max) {
      return {
        valid: false,
        error: rule.message ?? `${messagePrefix}不能大于${rule.max}`,
        usage
      };
    }

    if (rule.validator) {
      const customError = rule.validator(value, { ...context, rawValue: normalizedValue });

      if (customError) {
        return {
          valid: false,
          error: customError,
          usage
        };
      }
    }

    return {
      valid: true,
      parsedArgs: [value]
    };
  }

  if (rule.type === 'enum') {
    const enumValues = rule.enum ?? [];

    if (!enumValues.includes(normalizedValue)) {
      return {
        valid: false,
        error: rule.message ?? `${messagePrefix}只能是 ${enumValues.join(' / ')}`,
        usage
      };
    }

    if (rule.validator) {
      const customError = rule.validator(normalizedValue, { ...context, rawValue: normalizedValue });

      if (customError) {
        return {
          valid: false,
          error: customError,
          usage
        };
      }
    }

    return {
      valid: true,
      parsedArgs: [normalizedValue]
    };
  }

  if (rule.type === 'range') {
    const value = parseRange(normalizedValue, rule);

    if (!value) {
      return {
        valid: false,
        error: rule.message ?? `${messagePrefix}必须是区间，例如 1-10`,
        usage
      };
    }

    if (value.start > value.end) {
      return {
        valid: false,
        error: rule.message ?? `${messagePrefix}的起点不能大于终点`,
        usage
      };
    }

    if (typeof rule.min === 'number' && (value.start < rule.min || value.end < rule.min)) {
      return {
        valid: false,
        error: rule.message ?? `${messagePrefix}不能小于${rule.min}`,
        usage
      };
    }

    if (typeof rule.max === 'number' && (value.start > rule.max || value.end > rule.max)) {
      return {
        valid: false,
        error: rule.message ?? `${messagePrefix}不能大于${rule.max}`,
        usage
      };
    }

    if (rule.validator) {
      const customError = rule.validator(value, { ...context, rawValue: normalizedValue });

      if (customError) {
        return {
          valid: false,
          error: customError,
          usage
        };
      }
    }

    return {
      valid: true,
      parsedArgs: [value]
    };
  }

  if (rule.type === 'rest') {
    const value = String(normalizedValue);

    if (rule.validator) {
      const customError = rule.validator(value, { ...context, rawValue: normalizedValue });

      if (customError) {
        return {
          valid: false,
          error: customError,
          usage
        };
      }
    }

    return {
      valid: true,
      parsedArgs: [value]
    };
  }

  return {
    valid: true,
    parsedArgs: [String(normalizedValue)]
  };
}

function validateArgValue(
  commandPath: string | undefined,
  arg: RouteArgSchema,
  rawValue: string,
  rawArgs: string[],
  parsedArgs: RouteSchemaValue[],
  argIndex: number,
  displayIndex: number,
  usage?: string
): RouteValidationResult {
  const rules = arg.rules ?? [];
  const context: RouteRuleValidatorContext = {
    commandPath,
    argName: arg.name,
    argIndex,
    displayIndex,
    rawArgs,
    parsedArgs,
    rawValue
  };

  for (const rule of rules) {
    const result = validateTypedRule(rawValue, rule, context, usage);

    if (!result.valid) {
      return result;
    }

    if (rule.type) {
      return result;
    }
  }

  return {
    valid: true,
    parsedArgs: [rawValue]
  };
}

export function validateRouteArgs(rawArgs: string[], schema?: RouteSchema): RouteValidationResult {
  return validateRouteArgsForCommand(undefined, rawArgs, schema);
}

export function validateRouteArgsForCommand(commandPath: string | undefined, rawArgs: string[], schema?: RouteSchema): RouteValidationResult {
  const minArgs = getMinArgs(schema);
  const maxArgs = getMaxArgs(schema);
  const usage = schema?.usage;

  if (rawArgs.length < minArgs) {
    const missingRequiredArg = getMissingRequiredArg(rawArgs, schema);

    return {
      valid: false,
      error:
        schema?.messages?.tooFewArgs ??
        (missingRequiredArg ? `${formatArgReference(missingRequiredArg.arg.name, missingRequiredArg.displayIndex)}是必填的` : `至少需要 ${minArgs} 个参数`),
      usage
    };
  }

  if (typeof maxArgs === 'number' && rawArgs.length > maxArgs) {
    return {
      valid: false,
      error: schema?.messages?.tooManyArgs ?? `最多需要 ${maxArgs} 个参数`,
      usage
    };
  }

  const args = schema?.args ?? [];
  const parsedArgs: RouteSchemaValue[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const displayIndex = index + 1;
    const restRule = getRestRule(arg);

    if (restRule) {
      const rawValue = rawArgs.slice(index).join(' ').trim();
      const requiredRule = getRequiredRule(arg);

      if (!rawValue) {
        if (requiredRule) {
          return {
            valid: false,
            error: requiredRule.message ?? `${formatArgReference(arg.name, displayIndex)}是必填的`,
            usage
          };
        }

        if (arg.defaultValue !== undefined) {
          parsedArgs.push(arg.defaultValue);
        }
        continue;
      }

      const result = validateTypedRule(
        rawValue,
        restRule,
        {
          commandPath,
          argName: arg.name,
          argIndex: index,
          displayIndex,
          rawArgs,
          parsedArgs,
          rawValue
        },
        usage
      );

      if (!result.valid) {
        return result;
      }

      parsedArgs.push(...result.parsedArgs);
      break;
    }

    const rawValue = rawArgs[index];

    if (rawValue === undefined) {
      const requiredRule = getRequiredRule(arg);

      if (requiredRule) {
        return {
          valid: false,
          error: requiredRule.message ?? `${formatArgReference(arg.name, displayIndex)}是必填的`,
          usage
        };
      }

      if (arg.defaultValue !== undefined) {
        parsedArgs.push(arg.defaultValue);
      }
      continue;
    }

    const result = validateArgValue(commandPath, arg, rawValue, rawArgs, parsedArgs, index, displayIndex, usage);

    if (!result.valid) {
      return result;
    }

    parsedArgs.push(...result.parsedArgs);
  }

  return {
    valid: true,
    parsedArgs
  };
}
