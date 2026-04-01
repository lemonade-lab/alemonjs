import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { Options, Sequelize } from 'sequelize';
import { initLogPath, logging } from './utils';
import { getDialect, getMysqlConfig, getSqliteConfig } from '../../config';

type Config = {
  /**
   * 数据库方言，默认根据配置自动选择
   */
  dialect?: 'mysql' | 'sqlite';
  /**
   * MySQL 连接配置
   */
  uri?: string;
  /**
   * MySQL 连接配置
   */
  host?: string;
  /**
   * MySQL 连接端口
   */
  port?: number;
  /**
   * MySQL 用户名
   */
  user?: string;
  /**
   * MySQL 密码
   */
  password?: string;
  /**
   * MySQL 数据库名称
   */
  database?: string;
  /**
   * SQLite 数据库文件路径
   */
  storage?: string;
};

/**
 * 判断是否配置了 MySQL
 */
const hasMysqlConfig = (mysql: Record<string, any>): boolean => {
  return !!(mysql?.host || mysql?.uri || mysql?.user || mysql?.password || mysql?.database);
};

/**
 * 创建 SQLite 连接
 */
const createSqliteSequelize = (config: Config & Options): Sequelize => {
  const sqlite = getSqliteConfig();
  const { storage, ...options } = config;
  const storagePath = storage || sqlite?.storage || join(process.cwd(), 'data', 'alemonjs.sqlite');

  // 确保 SQLite 文件所在目录存在
  mkdirSync(dirname(storagePath), { recursive: true });

  return new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: logging,
    ...options
  });
};

/**
 * 创建 MySQL 连接
 */
const createMysqlSequelize = (config: Config & Options, mysql: Record<string, any>): Sequelize => {
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

/**
 * @fileoverview 数据库连接模块，支持 MySQL 和 SQLite
 * @module mysql
 * @description 未配置 MySQL 时自动回退到 SQLite
 * @returns
 */
export const getSequelize = (config: Config & Options = {}): Sequelize => {
  if (global.sequelize) {
    return global.sequelize;
  }
  initLogPath();
  const mysql = getMysqlConfig();
  const configDialect = config.dialect || getDialect();

  // 如果显式指定 dialect 为 sqlite，或者没有 MySQL 配置，则使用 SQLite
  const useSqlite = configDialect === 'sqlite' || (!configDialect && !hasMysqlConfig(mysql) && !config.uri && !config.host);

  if (useSqlite) {
    global.sequelize = createSqliteSequelize(config);
  } else {
    global.sequelize = createMysqlSequelize(config, mysql);
  }

  return global.sequelize;
};
