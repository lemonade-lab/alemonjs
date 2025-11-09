import { Attributes, DataTypes, FindOptions, Model, ModelAttributes, ModelCtor, ModelOptions, ModelStatic, Optional } from 'sequelize';

/**
 * 找到所有数据
 * @param this
 * @param options
 * @returns
 */
function findAllValues<M extends Model>(this: ModelStatic<M>, options?: FindOptions<Attributes<M>>): Promise<Attributes<M>[]> {
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
function findOneValue<M extends Model>(this: ModelStatic<M>, options: FindOptions<Attributes<M>> = {}): Promise<Attributes<M>> {
  return this.findOne({
    ...options,
    raw: true
  });
}

/**
 * 随机找到一条数据
 * @param this
 * @param options
 * @returns
 */
function findOneRandomValue<M extends Model>(this: ModelStatic<M>, options: FindOptions<Attributes<M>> = {}): Promise<Attributes<M>> {
  return this.findOne({
    ...options,
    order: this.sequelize.random(),
    raw: true
  });
}

/**
 * 找到所有数据
 * @param this
 * @param options
 * @returns
 */
function findAllCurrentValues<M extends Model>(this: ModelStatic<M>, options: FindOptions<Attributes<M>> = {}): Promise<Attributes<M>[]> {
  const where = options?.where ?? {};

  where['deleted_at'] = null; // 确保只查询未删除的数据

  return this.findAll({
    ...options,
    where: where,
    raw: true
  });
}

/**
 * 找到一条数据
 * @param this
 * @param options
 * @returns
 */
function findOneCurrentValue<M extends Model>(this: ModelStatic<M>, options: FindOptions<Attributes<M>> = {}): Promise<Attributes<M>> {
  const where = options?.where ?? {};

  where['deleted_at'] = null; // 确保只查询未删除的数据

  return this.findOne({
    ...options,
    where: where,
    raw: true
  });
}

/**
 * 找到或创建一条数据
 * @param this
 * @param options
 * @returns
 */
function findOrCreateValue<M extends Model>(this: ModelStatic<M>, options: any = {}): Promise<[Attributes<M>, boolean]> {
  return this.findOrCreate({
    ...options,
    raw: true
  });
}

/**
 * 软删除
 * @param this
 * @param options
 * @returns
 */
function deleted<M extends Model>(this: ModelStatic<M>, options: any = {}): Promise<number> {
  const where = options?.where ?? {};

  where['deleted_at'] = null; // 确保只操作未删除的数据

  return this.update(
    {
      deleted_at: new Date()
    },
    {
      ...options,
      where: where
    }
  ).then(result => result?.[0] || 0);
}

const initModelOptions: ModelOptions = {
  freezeTableName: true, // 禁止自动复数化表名
  timestamps: true, // 自动添加时间戳
  deletedAt: 'deleted_at', // 重命名 deletedAt 字段为 deleted_at
  createdAt: 'created_at', // 重命名 createAt 字段为 created_at
  updatedAt: 'updated_at' // 重命名 updateAt 字段为 updated_at
};

/**
 * 获取模型的属性类型
 */
export type AttributesModel<T extends ModelCtor<Model>> = T extends ModelCtor<infer M> ? (M extends Model<infer U, object> ? U : never) : never;

type ModelBaseProps = {
  id: number;
  created_at?: Date | null;
  updated_at?: Date | null;
  deleted_at?: Date | null;
};

const MoDelInitOptions = {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '更新时间'
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '删除时间'
  }
};

type InitConfig<T> = ModelAttributes<Model<T & ModelBaseProps>, Optional<Attributes<Model<T & ModelBaseProps>>, keyof ModelBaseProps>>;

type Base = {
  [key in string]: unknown;
};

export class BaseModel<T = ModelBaseProps> extends Model<T & ModelBaseProps> {
  public static findAllValues = findAllValues;
  public static findOneValue = findOneValue;
  public static findOneRandomValue = findOneRandomValue;
  public static findAllCurrentValues = findAllCurrentValues;
  public static findOneCurrentValue = findOneCurrentValue;
  public static findOrCreateValue = findOrCreateValue;
  public static deleted = deleted;
  public static generate<T extends Base>(config: InitConfig<T>, options: ModelOptions = {}): ModelCtor<Model<T & ModelBaseProps>> {
    this.init(
      {
        ...MoDelInitOptions,
        ...config
      },
      {
        ...initModelOptions,
        sequelize: this.sequelize,
        ...options
      }
    );

    return this;
  }
}
