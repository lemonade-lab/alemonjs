import { appendFile, mkdirSync } from 'fs';
import { join } from 'path';
import dayjs from 'dayjs';
import { getMysqlConfig } from '../../config';

/**
 * 初始化日志路径
 * @returns 日志目录路径
 */
export const initLogPath = () => {
  const mysql = getMysqlConfig();
  const dir = mysql.logPath || join(process.cwd(), 'logs', 'mysql');

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
