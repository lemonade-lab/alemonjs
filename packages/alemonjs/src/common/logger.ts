import { mkdirSync } from 'node:fs';
import log4js from 'log4js';

const createLogger = () => {
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

  const logDir = process.env?.LOG_PATH ?? `./logs/${process.env.LOG_NAME ?? ''}`;

  mkdirSync(logDir, { recursive: true });

  const level = process.env.NODE_ENV === 'development' ? 'trace' : 'info';
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

  log4js.configure({
    appenders: {
      console: {
        type: 'console',
        layout: {
          type: 'pattern',
          pattern
        }
      },
      command: {
        type: 'dateFile',
        filename: `${logDir}/command`,
        pattern: 'yyyy-MM-dd.log',
        numBackups: 15,
        alwaysIncludePattern: true,
        layout: {
          type: 'pattern',
          pattern
        }
      },
      error: {
        type: 'dateFile',
        filename: `${logDir}/error`,
        pattern: 'yyyy-MM-dd.log',
        numBackups: 15,
        alwaysIncludePattern: true,
        layout: {
          type: 'pattern',
          pattern
        }
      }
    },
    categories: {
      default: { appenders: ['console'], level },
      command: { appenders: ['console', 'command'], level: 'info' },
      error: { appenders: ['console', 'command', 'error'], level: 'warn' }
    }
  });

  const defaultLogger = log4js.getLogger('default');
  const commandLogger = log4js.getLogger('command');
  const errorLogger = log4js.getLogger('error');

  return {
    trace: defaultLogger.trace.bind(defaultLogger),
    debug: defaultLogger.debug.bind(defaultLogger),
    info: commandLogger.info.bind(commandLogger),
    mark: commandLogger.mark.bind(commandLogger),
    warn: errorLogger.warn.bind(errorLogger),
    error: errorLogger.error.bind(errorLogger),
    fatal: errorLogger.fatal.bind(errorLogger)
  };
};

export class Logger {
  #logger = null;

  constructor() {
    this.#logger = createLogger();

    if (!global.logger) {
      global.logger = this.#logger;
    }
  }

  get value() {
    return this.#logger;
  }
}

export const logger = new Logger().value;
