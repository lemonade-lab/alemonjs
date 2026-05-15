import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import module from 'module';
import { Options, Sequelize } from 'sequelize';
import { SqlDialect, getDialect, getMysqlConfig, getPgsqlConfig, getSqliteConfig } from '../../config';
import { initLogPath, logging } from './utils';

type Config = {
  /**
   * 数据库方言，代码显式传入时优先级最高
   */
  dialect?: SqlDialect;
  /**
   * 通用连接 URI
   */
  uri?: string;
  /**
   * 主机
   */
  host?: string;
  /**
   * 端口
   */
  port?: number;
  /**
   * 用户名
   */
  user?: string;
  /**
   * 密码
   */
  password?: string;
  /**
   * 数据库名称
   */
  database?: string;
  /**
   * SQLite 数据库文件路径
   */
  storage?: string;
};

type SqlConnectConfig = {
  uri?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  storage?: string;
};

type DialectResolution = {
  dialect: SqlDialect;
  source: 'code' | 'config' | 'auto' | 'fallback';
  warning?: string;
};

const initRequire = () => {};

initRequire.resolve = () => '';
const require = module?.createRequire?.(import.meta.url) ?? initRequire;
const appRequire = module?.createRequire?.(join(process.cwd(), 'package.json')) ?? require;

const DIALECT_DRIVER_MAP: Record<SqlDialect, string> = {
  pgsql: 'pg',
  mysql: 'mysql2',
  sqlite: 'sqlite3'
};

const normalizeDialect = (dialect?: string): SqlDialect | null => {
  if (!dialect) {
    return null;
  }
  const value = dialect.trim().toLowerCase();

  if (value === 'pgsql' || value === 'pg' || value === 'postgres' || value === 'postgresql') {
    return 'pgsql';
  }
  if (value === 'mysql' || value === 'mariadb') {
    return 'mysql';
  }
  if (value === 'sqlite' || value === 'sqlite3') {
    return 'sqlite';
  }

  return null;
};

const isDriverInstalled = (packageName: string) => {
  try {
    appRequire.resolve(packageName);

    return true;
  } catch {
    try {
      require.resolve(packageName);

      return true;
    } catch {
      return false;
    }
  }
};

const warnDialectFallback = (message: string) => {
  logger.warn(`[@alemonjs/db] ${message}`);
};

const hasSqlConnectConfig = (config: SqlConnectConfig): boolean => {
  return Boolean(config?.uri || config?.host || config?.port || config?.user || config?.password || config?.database);
};

const getConnectConfig = (dialect: SqlDialect, config: Config): SqlConnectConfig => {
  if (dialect === 'pgsql') {
    const pgsql = getPgsqlConfig();

    return {
      uri: config.uri || pgsql?.uri,
      host: config.host || pgsql?.host,
      port: config.port || pgsql?.port,
      user: config.user || pgsql?.user,
      password: config.password || pgsql?.password,
      database: config.database || pgsql?.database
    };
  }

  if (dialect === 'mysql') {
    const mysql = getMysqlConfig();

    return {
      uri: config.uri || mysql?.uri,
      host: config.host || mysql?.host,
      port: config.port || mysql?.port,
      user: config.user || mysql?.user,
      password: config.password || mysql?.password,
      database: config.database || mysql?.database
    };
  }

  const sqlite = getSqliteConfig();

  return {
    storage: config.storage || sqlite?.storage
  };
};

const createSqliteSequelize = (config: Config & Options): Sequelize => {
  const sqlite = getSqliteConfig();
  const { storage, ...options } = config;
  const storagePath = storage || sqlite?.storage || join(process.cwd(), 'data', 'alemonjs.sqlite');

  mkdirSync(dirname(storagePath), { recursive: true });

  return new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: logging,
    ...options
  });
};

const createMysqlSequelize = (config: Config & Options): Sequelize => {
  const mysql = getMysqlConfig();
  const { host, port, user, password, database, uri, ...options } = config;
  const baseConfig = {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'alemonjs'
  };
  const connectConfig = {
    host: host || mysql?.host || baseConfig.host,
    port: port || mysql?.port || baseConfig.port,
    user: user || mysql?.user || baseConfig.user,
    password: password || mysql?.password || baseConfig.password,
    database: database || mysql?.database || baseConfig.database
  };
  const url = uri || mysql?.uri || '';

  return new Sequelize(url || `mysql://${connectConfig.user}:${connectConfig.password}@${connectConfig.host}:${connectConfig.port}/${connectConfig.database}`, {
    dialect: 'mysql',
    logging: logging,
    timezone: '+08:00',
    ...options
  });
};

const createPgsqlSequelize = (config: Config & Options): Sequelize => {
  const pgsql = getPgsqlConfig();
  const { host, port, user, password, database, uri, ...options } = config;
  const baseConfig = {
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: '',
    database: 'alemonjs'
  };
  const connectConfig = {
    host: host || pgsql?.host || baseConfig.host,
    port: port || pgsql?.port || baseConfig.port,
    user: user || pgsql?.user || baseConfig.user,
    password: password || pgsql?.password || baseConfig.password,
    database: database || pgsql?.database || baseConfig.database
  };
  const url = uri || pgsql?.uri || '';

  return new Sequelize(url || `postgres://${connectConfig.user}:${connectConfig.password}@${connectConfig.host}:${connectConfig.port}/${connectConfig.database}`, {
    dialect: 'postgres',
    logging: logging,
    ...options
  });
};

const resolveAutoDialect = (config: Config): DialectResolution | null => {
  const candidates: SqlDialect[] = [];
  const pgsqlConfig = getConnectConfig('pgsql', config);
  const mysqlConfig = getConnectConfig('mysql', config);

  if (hasSqlConnectConfig(pgsqlConfig)) {
    candidates.push('pgsql');
  }
  if (hasSqlConnectConfig(mysqlConfig)) {
    candidates.push('mysql');
  }
  candidates.push('sqlite');

  const uniqueCandidates = [...new Set(candidates)];

  for (const dialect of uniqueCandidates) {
    const driver = DIALECT_DRIVER_MAP[dialect];

    if (isDriverInstalled(driver)) {
      return {
        dialect,
        source: 'auto'
      };
    }

    if (dialect !== 'sqlite') {
      warnDialectFallback(`Detected ${dialect} configuration, but package "${driver}" is not installed. Skip ${dialect}.`);
    }
  }

  return null;
};

const resolveDialect = (config: Config): DialectResolution => {
  const codeDialect = normalizeDialect(config.dialect);

  if (codeDialect) {
    const driver = DIALECT_DRIVER_MAP[codeDialect];

    if (isDriverInstalled(driver)) {
      return {
        dialect: codeDialect,
        source: 'code'
      };
    }
    if (isDriverInstalled(DIALECT_DRIVER_MAP.sqlite)) {
      return {
        dialect: 'sqlite',
        source: 'fallback',
        warning: `Requested dialect "${codeDialect}" from code requires package "${driver}". Fallback to "sqlite".`
      };
    }
    throw new Error(`Requested dialect "${codeDialect}" from code requires package "${driver}". Package "sqlite3" is also unavailable, SQL support cannot be used.`);
  }

  const configDialect = normalizeDialect(getDialect());

  if (configDialect) {
    const driver = DIALECT_DRIVER_MAP[configDialect];

    if (isDriverInstalled(driver)) {
      return {
        dialect: configDialect,
        source: 'config'
      };
    }
    if (isDriverInstalled(DIALECT_DRIVER_MAP.sqlite)) {
      return {
        dialect: 'sqlite',
        source: 'fallback',
        warning: `Requested dialect "${configDialect}" from config requires package "${driver}". Fallback to "sqlite".`
      };
    }
    throw new Error(`Requested dialect "${configDialect}" from config requires package "${driver}". Package "sqlite3" is also unavailable, SQL support cannot be used.`);
  }

  const autoDialect = resolveAutoDialect(config);

  if (autoDialect) {
    return autoDialect;
  }

  throw new Error('No available SQL driver found. Install one of: "pg", "mysql2", or "sqlite3".');
};

/**
 * @fileoverview 数据库连接模块，支持 PostgreSQL、MySQL 和 SQLite
 * @module sql
 * @description 代码/配置显式指定方言时优先遵守；缺驱动时发出 warning 并尝试回退到 SQLite
 * @returns
 */
export const getSequelize = (config: Config & Options = {}): Sequelize => {
  if (global.sequelize) {
    return global.sequelize;
  }
  initLogPath();

  const resolved = resolveDialect(config);

  if (resolved.warning) {
    warnDialectFallback(resolved.warning);
  }

  if (resolved.source === 'auto') {
    logger.debug(`[@alemonjs/db] SQL dialect resolved to "${resolved.dialect}"`);
  }

  if (resolved.dialect === 'pgsql') {
    global.sequelize = createPgsqlSequelize(config);
  } else if (resolved.dialect === 'mysql') {
    global.sequelize = createMysqlSequelize(config);
  } else {
    global.sequelize = createSqliteSequelize(config);
  }

  return global.sequelize;
};
