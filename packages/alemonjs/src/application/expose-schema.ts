import type { ExposeValueSchema } from '../types/expose/index.js';

const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const plain = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);

/** 注册阶段先检查契约自身，避免未实现的 JSON Schema 约束被当成已经校验。 */
export function assertExposeSchema(schema: ExposeValueSchema, depth = 0): void {
  if (depth > 32 || !plain(schema)) {
    throw new Error('Invalid Expose schema');
  }
  const keywords: Record<string, string[]> = {
    null: [],
    boolean: [],
    string: ['enum', 'minLength', 'maxLength'],
    number: ['minimum', 'maximum'],
    integer: ['minimum', 'maximum'],
    array: ['items', 'minItems', 'maxItems'],
    object: ['properties', 'required', 'additionalProperties']
  };

  if (!own(keywords, schema.type)) {
    throw new Error('Unsupported Expose schema type');
  }
  const allowed = ['type', 'description', ...keywords[schema.type]];

  if (Object.keys(schema).some(key => !allowed.includes(key))) {
    throw new Error('Unsupported Expose schema keyword');
  }
  if (schema.description !== undefined && typeof schema.description !== 'string') {
    throw new Error('Invalid schema description');
  }
  const bounds =
    schema.type === 'string'
      ? ['minLength', 'maxLength']
      : schema.type === 'array'
      ? ['minItems', 'maxItems']
      : schema.type === 'number' || schema.type === 'integer'
      ? ['minimum', 'maximum']
      : [];

  for (const key of bounds) {
    const value = schema[key];

    if (value !== undefined && (!Number.isFinite(value) || (key !== 'minimum' && key !== 'maximum' && (!Number.isInteger(value) || value < 0)))) {
      throw new Error('Invalid schema bound');
    }
  }
  if (bounds.length && schema[bounds[0]] !== undefined && schema[bounds[1]] !== undefined && schema[bounds[0]] > schema[bounds[1]]) {
    throw new Error('Invalid schema bounds');
  }
  if (
    schema.type === 'string' &&
    schema.enum !== undefined &&
    (!Array.isArray(schema.enum) || !schema.enum.length || schema.enum.some(value => typeof value !== 'string'))
  ) {
    throw new Error('Invalid schema enum');
  }
  if (schema.type === 'array') {
    assertExposeSchema(schema.items, depth + 1);
  }
  if (schema.type === 'object') {
    if (!plain(schema.properties) || schema.additionalProperties !== false) {
      throw new Error('Object schemas must declare properties and additionalProperties: false');
    }
    if (
      schema.required !== undefined &&
      (!Array.isArray(schema.required) || schema.required.some(key => typeof key !== 'string' || !own(schema.properties, key)))
    ) {
      throw new Error('Invalid schema required properties');
    }
    for (const child of Object.values(schema.properties)) {
      assertExposeSchema(child, depth + 1);
    }
  }
}

/** 返回字段路径，不把实际参数或敏感值写入错误。 */
export function validateExposeValue(schema: ExposeValueSchema, value: unknown, path = '$', depth = 0): string | undefined {
  if (depth > 32) {
    return path;
  }
  switch (schema.type) {
    case 'null':
      return value === null ? undefined : path;
    case 'boolean':
      return typeof value === 'boolean' ? undefined : path;
    case 'string': {
      if (typeof value !== 'string') {
        return path;
      }
      const length = [...value].length;

      return (schema.enum && !schema.enum.includes(value)) ||
        (schema.minLength !== undefined && length < schema.minLength) ||
        (schema.maxLength !== undefined && length > schema.maxLength)
        ? path
        : undefined;
    }
    case 'integer':
    case 'number':
      return typeof value !== 'number' ||
        !Number.isFinite(value) ||
        (schema.type === 'integer' && !Number.isSafeInteger(value)) ||
        (schema.minimum !== undefined && value < schema.minimum) ||
        (schema.maximum !== undefined && value > schema.maximum)
        ? path
        : undefined;
    case 'array': {
      if (
        !Array.isArray(value) ||
        (schema.minItems !== undefined && value.length < schema.minItems) ||
        (schema.maxItems !== undefined && value.length > schema.maxItems)
      ) {
        return path;
      }
      for (let index = 0; index < value.length; index++) {
        const issue = validateExposeValue(schema.items, value[index], `${path}[${index}]`, depth + 1);

        if (issue) {
          return issue;
        }
      }

      return;
    }
    case 'object': {
      if (!plain(value)) {
        return path;
      }
      for (const key of schema.required ?? []) {
        if (!own(value, key)) {
          return `${path}.${key}`;
        }
      }
      for (const key of Object.keys(value)) {
        if (!own(schema.properties, key)) {
          return path;
        }
        const issue = validateExposeValue(schema.properties[key], value[key], `${path}.${key}`, depth + 1);

        if (issue) {
          return issue;
        }
      }
    }
  }
}

/** 仅复制数据属性，不执行 getter；拒绝静默丢失字段的非 JSON 值。 */
export function snapshotExposeValue(value: unknown, ancestors = new Set<object>(), depth = 0): unknown {
  if (depth > 32) {
    throw new Error('Snapshot depth exceeded');
  }
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== 'object' || (!Array.isArray(value) && !plain(value)) || ancestors.has(value)) {
    throw new Error('Not plain JSON data');
  }
  const array = Array.isArray(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(descriptors).filter(key => !array || key !== 'length');
  const result = array ? [] : {};

  if (array && keys.length !== value.length) {
    throw new Error('Sparse array or extra fields');
  }
  ancestors.add(value);
  try {
    for (const key of keys) {
      const descriptor = descriptors[key as string];

      if (typeof key !== 'string' || !descriptor.enumerable || !own(descriptor, 'value')) {
        throw new Error('Not a data property');
      }
      if (array && (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length)) {
        throw new Error('Invalid array index');
      }
      Object.defineProperty(result, key, {
        value: snapshotExposeValue(descriptor.value, ancestors, depth + 1),
        enumerable: true,
        writable: true,
        configurable: true
      });
    }
  } finally {
    ancestors.delete(value);
  }

  return result;
}

/** 仅用于已生成的纯数据快照；授权钩子没有改写执行参数的能力。 */
export function freezeExposeSnapshot<T>(value: T): T {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) {
      freezeExposeSnapshot(child);
    }
    Object.freeze(value);
  }

  return value;
}
