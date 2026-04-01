import { EventKeys, Events } from 'types';
import { getEventOrThrow } from './common';

type UseEventOptions<T extends EventKeys> = {
  selects: T | T[];
  regular?: RegExp;
  prefix?: string;
  exact?: string;
};

const isOptions = <T extends EventKeys>(v: Events[T] | UseEventOptions<T>): v is UseEventOptions<T> => {
  return typeof v === 'object' && 'selects' in v;
};

type UseEventResult<T extends EventKeys> = {
  current: Events[T];
  value: Events[T]['value'];
  match: { selects: boolean; regular: boolean; prefix: boolean; exact: boolean };
};

export function useEvent<T extends EventKeys>(options?: UseEventOptions<T>): readonly [UseEventResult<T>];

export function useEvent<T extends EventKeys>(event?: Events[T], options?: UseEventOptions<T>): readonly [UseEventResult<T>];

/**
 * @param event
 * @param options
 * @returns
 */
export function useEvent<T extends EventKeys>(eventOrOptions?: Events[T] | UseEventOptions<T>, options?: UseEventOptions<T>) {
  let eventArg: Events[T] | undefined;
  let opts: UseEventOptions<T> | undefined;

  if (eventOrOptions && isOptions<T>(eventOrOptions)) {
    opts = eventOrOptions;
  } else {
    eventArg = eventOrOptions as Events[T] | undefined;
    opts = options;
  }

  const { selects, regular, prefix, exact } = opts ?? ({} as Partial<UseEventOptions<T>>);
  const eventValue = getEventOrThrow<T>(eventArg);
  const { name, MessageText } = eventValue;
  const selectsArr = Array.isArray(selects) ? selects : [selects];

  const match = {
    selects: (selectsArr as EventKeys[]).includes(name),
    exact: !!(exact && MessageText === exact),
    prefix: !!(prefix && MessageText?.startsWith(prefix)),
    regular: !!(regular && MessageText && regular.test(MessageText))
  };

  const r = {
    current: { ...eventValue },
    match
  };

  Object.defineProperty(r, 'value', {
    get() {
      return eventValue.value;
    }
  });

  return [r] as const;
}
