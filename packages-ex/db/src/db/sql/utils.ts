import { appendFile, mkdirSync } from 'fs';
import { join } from 'path';
import dayjs from 'dayjs';
import { getMysqlConfig, getPgsqlConfig, getSqlConfig, getSqliteConfig } from '../../config';

/**
 * 初始化日志路径
 * @returns 日志目录路径
 */
export const initLogPath = () => {
  const sql = getSqlConfig();
  const pgsql = getPgsqlConfig();
  const mysql = getMysqlConfig();
  const sqlite = getSqliteConfig();
  const dir = sql.logPath || pgsql.logPath || mysql.logPath || sqlite.logPath || join(process.cwd(), 'logs', 'db');

  mkdirSync(dir, { recursive: true });

  return dir;
};

/**
 * @param sql
 * @returns
 */
export const logging = (sql: string) => {
  const dir = initLogPath();
  const TIME = dayjs().format('YYYY-MM-DD');
  const time = dayjs().format('YYYY-MM-DD HH:mm:ss');

  appendFile(join(dir, `${TIME}.log`), `${time}\n${sql}\n`, err => {
    if (err) {
      logger.error('Error writing to log file:', err);
    }
  });

  return false;
};
