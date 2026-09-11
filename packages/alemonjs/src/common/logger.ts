import { mkdirSync } from 'node:fs';
import log4js from 'log4js';
import type { LoggerUtils } from '../types/logger/index.js';

const LOG_LEVELS = new Set(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'mark', 'off']);

const getLogLevel = () => {
  const configuredLevel = process.env.LOG_LEVEL?.toLowerCase();

  if (configuredLevel && LOG_LEVELS.has(configuredLevel)) {
    return configuredLevel;
  }

  return process.env.NODE_ENV === 'development' ? 'trace' : 'info';
};

const getBackupCount = () => {
  const configuredCount = Number.parseInt(process.env.LOG_BACKUPS ?? '', 10);

  return Number.isSafeInteger(configuredCount) && configuredCount >= 0 ? configuredCount : 15;
};

const serializeLogArgument = (argument: unknown) => {
  if (argument instanceof Error) {
    return {
      name: argument.name,
      message: argument.message,
      stack: argument.stack
    };
  }

  return argument;
};

const bindLoggerMethod = (method: (...args: any[]) => void) => {
  return (...args: any[]) => method(...args.map(serializeLogArgument));
};

const createLogger = (): LoggerUtils => {
  if (process.env.BROWSER_ENV === 'browser') {
    return {
      trace: console.trace.bind(console),
      debug: console.debug.bind(console),
      info: console.info.bind(console),
      mark: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      fatal: console.error.bind(console)
    };
  }

  const writeToFile = process.env.LOG_FILE !== 'false';
  const logDir = process.env?.LOG_PATH ?? `./logs/${process.env.LOG_NAME ?? ''}`;
  const level = getLogLevel();
  const backups = getBackupCount();
  const hideTime = process.env.LOGGER_TIME === 'false';
  const hideLevel = process.env.LOGGER_LEVEL === 'false';
  let pattern = '';

  if (hideTime && hideLevel) {
    pattern = '%m';
  } else if (hideTime && !hideLevel) {
    pattern = '[%p] %m';
  } else if (!hideTime && hideLevel) {
    pattern = '[%d{yyyy-MM-dd hh:mm:ss}] %m';
  } else {
    pattern = '[%d{yyyy-MM-dd hh:mm:ss}][%p] %m';
  }

  const appenders: Record<string, unknown> = {
    console: {
      type: 'console',
      layout: {
        type: 'pattern',
        pattern
      }
    }
  };

  if (writeToFile) {
    mkdirSync(logDir, { recursive: true });
    appenders.command = {
      type: 'dateFile',
      filename: `${logDir}/command`,
      pattern: 'yyyy-MM-dd.log',
      numBackups: backups,
      alwaysIncludePattern: true,
      layout: {
        type: 'pattern',
        pattern
      }
    };
    appenders.error = {
      type: 'dateFile',
      filename: `${logDir}/error`,
      pattern: 'yyyy-MM-dd.log',
      numBackups: backups,
      alwaysIncludePattern: true,
      layout: {
        type: 'pattern',
        pattern
      }
    };
  }

  log4js.configure({
    appenders,
    categories: {
      default: { appenders: ['console'], level },
      command: { appenders: writeToFile ? ['console', 'command'] : ['console'], level },
      error: { appenders: writeToFile ? ['console', 'command', 'error'] : ['console'], level }
    }
  });

  const defaultLogger = log4js.getLogger('default');
  const commandLogger = log4js.getLogger('command');
  const errorLogger = log4js.getLogger('error');

  if (writeToFile) {
    // dateFile appenders create their output lazily. Emit an initialization entry
    // so each Node process has a command log file as soon as logging is configured.
    commandLogger.info('[logger] initialized');
  }

  return {
    trace: bindLoggerMethod(defaultLogger.trace.bind(defaultLogger)),
    debug: bindLoggerMethod(defaultLogger.debug.bind(defaultLogger)),
    info: bindLoggerMethod(commandLogger.info.bind(commandLogger)),
    mark: bindLoggerMethod(commandLogger.mark.bind(commandLogger)),
    warn: bindLoggerMethod(errorLogger.warn.bind(errorLogger)),
    error: bindLoggerMethod(errorLogger.error.bind(errorLogger)),
    fatal: bindLoggerMethod(errorLogger.fatal.bind(errorLogger))
  };
};

let shutdownPromise: Promise<void> | undefined;

/** Flush pending log4js writes before a process exits. */
export const shutdownLogger = () => {
  shutdownPromise ??= new Promise(resolve => {
    log4js.shutdown(() => resolve());
  });

  return shutdownPromise;
};

export class Logger {
  #logger: LoggerUtils;

  constructor() {
    this.#logger = global.logger ?? createLogger();
    global.logger ??= this.#logger;
  }

  get value() {
    return this.#logger;
  }
}

export const logger = new Logger().value;
