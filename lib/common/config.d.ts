import { Package } from "../types/package/index.js";
import { ConversationOptions } from "../application/conversation.js";
import { RateLimitOptions } from "../application/rate-limit.js";
import { TypingOptions } from "../application/typing.js";
import "../types/index.js";
import { Language } from "./i18n.js";
//#region src/common/config.d.ts
type ConfigValue = {
  [key: string]: any;
  /** Framework messages: Chinese by default; changes apply without restarting. */
  language?: Language;
  autoPort?: boolean;
  apps?: string[] | {
    [key: string]: boolean;
  };
  master_key?: {
    [key: string]: boolean;
  } | string[];
  master_id?: {
    [key: string]: boolean;
  } | string[];
  bot_key?: {
    [key: string]: boolean;
  } | string[];
  bot_id?: {
    [key: string]: boolean;
  } | string[];
  disabled_text_regular?: string;
  disabled_selects?: {
    [key: string]: boolean;
  };
  disabled_user_id?: {
    [key: string]: boolean;
  } | string[];
  disabled_user_key?: {
    [key: string]: boolean;
  } | string[];
  redirect_regular?: string;
  redirect_target?: string;
  redirect_text_regular?: string;
  redirect_text_target?: string;
  mapping_text?: {
    regular?: string;
    target?: string;
  }[];
  processor?: {
    repeated_event_time?: number;
    repeated_user_time?: number;
    /** Opt-in observed message history, quote index and prompt context. */
    conversation?: ConversationOptions;
    rateLimit?: RateLimitOptions;
    /** Automatic QQ C2C input notifications; explicit tasks can use withTyping. */
    autoTyping?: Omit<TypingOptions, 'signal' | 'onError'>;
  };
};
type ConfigListener<T extends ConfigValue = ConfigValue> = (value: T) => void;
declare class ConfigCore<T extends ConfigValue = ConfigValue> {
  #private;
  constructor(dir: string, memoryValue?: T);
  get value(): T | null;
  /**
   * 配置文件绝对路径（供外部做保注释的直接文件读写）
   */
  get path(): string | null;
  /**
   * 重新读取配置文件并应用。
   * 外部绕过 saveValue 直接改写文件（如保留注释的增量写入）后调用，同步内存值
   */
  reload(): void;
  saveValue(value: T): void;
  onWatch(listener: ConfigListener<T>): () => void;
  dispose(): void;
  get package(): Package | null;
  get argv(): {
    [key: string]: string;
  };
}
declare const getConfig: <T extends ConfigValue = ConfigValue>() => ConfigCore<T>;
declare const getConfigValue: <T extends ConfigValue = ConfigValue>() => T;
declare const onWatchConfigValue: <T extends ConfigValue = ConfigValue>(callback: ConfigListener<T>) => (() => void);
//#endregion
export { type ConfigCore, type ConfigListener, type ConfigValue, getConfig, getConfigValue, onWatchConfigValue };