import { appendFile, mkdirSync } from 'fs';
import { join } from 'path';
import dayjs from 'dayjs';
import { Attributes, FindOptions, ModelStatic, Model, ModelCtor } from 'sequelize';
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

/**
 * 找到所有数据
 * @param this
 * @param options
 * @returns
 */
export function findAllValues<M extends Model>(this: ModelStatic<M>, options?: FindOptions<Attributes<M>>): Promise<Attributes<M>[]> {
  return this.findAll({
    ...options,
    raw: true
  });
}

/**
 * 找到一条数据
 * @param this
 * @param options
 * @returns
 */
export function findOneValue<M extends Model>(this: ModelStatic<M>, options: FindOptions<Attributes<M>> = {}): Promise<Attributes<M>> {
  return this.findOne({
    ...options,
    raw: true
  });
}

/**
 * 找到所有数据
 * @param this
 * @param options
 * @returns
 */
export function findAllCurrentValues<M extends Model>(this: ModelStatic<M>, options: FindOptions<Attributes<M>> = {}): Promise<Attributes<M>[]> {
  return this.findAll({
    ...options,
    where: {
      ...(options?.where || {}),
      deleted_at: null // 确保只查询未删除的数据
    },
    raw: true
  });
}

/**
 * 找到一条数据
 * @param this
 * @param options
 * @returns
 */
export function findOneCurrentValue<M extends Model>(this: ModelStatic<M>, options: FindOptions<Attributes<M>> = {}): Promise<Attributes<M>> {
  return this.findOne({
    ...options,
    where: {
      ...(options?.where || {}),
      deleted_at: null // 确保只查询未删除的数据
    },
    raw: true
  });
}

export function findOrCreateValue<M extends Model>(this: ModelStatic<M>, options: FindOptions<Attributes<M>> = {}): Promise<[Attributes<M>, boolean]> {
  return this.findOrCreate({
    ...options,
    raw: true
  });
}

/**
 * 获取模型的属性类型
 */
export type AttributesModel<T extends ModelCtor<Model>> = T extends ModelCtor<infer M> ? (M extends Model<infer U, object> ? U : never) : never;
