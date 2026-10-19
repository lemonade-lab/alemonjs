//#region src/application/router/validator.d.ts
type RouteRangeValue = {
  start: number;
  end: number;
};
type SchemaValueType = 'string' | 'number' | 'enum' | 'range' | 'rest';
type RouteSchemaValue = string | number | RouteRangeValue;
type RouteRuleValidatorContext = {
  commandPath?: string;
  argName: string;
  argIndex: number;
  displayIndex: number;
  rawArgs: string[];
  parsedArgs: RouteSchemaValue[];
  rawValue: string;
};
type RouteRule = {
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
type RouteArgSchema = {
  name: string;
  description?: string;
  defaultValue?: RouteSchemaValue;
  rules?: RouteRule[];
};
type RouteSchema = {
  args?: RouteArgSchema[];
  usage?: string;
  messages?: {
    tooFewArgs?: string;
    tooManyArgs?: string;
  };
};
type RouteValidationResult = {
  valid: true;
  parsedArgs: RouteSchemaValue[];
} | {
  valid: false;
  error: string;
  usage?: string;
};
declare function validateRouteArgs(rawArgs: string[], schema?: RouteSchema): RouteValidationResult;
declare function validateRouteArgsForCommand(commandPath: string | undefined, rawArgs: string[], schema?: RouteSchema): RouteValidationResult;
//#endregion
export { RouteArgSchema, RouteRangeValue, RouteRule, RouteRuleValidatorContext, RouteSchema, RouteSchemaValue, RouteValidationResult, SchemaValueType, validateRouteArgs, validateRouteArgsForCommand };