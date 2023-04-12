import { green, red } from 'kolorist'
/* 实例,数据类型,模型 */
import { sequelize, DataTypes, Model } from '../../db/mysql'
/* 继承 */
class users extends Model {}
users.init(
  {
    // 在这里定义模型属性
    user_id: {
      type: DataTypes.BIGINT,
      primaryKey: true //必须设置主键属性
    },
    user_account: DataTypes.STRING,
    user_password: DataTypes.STRING
  },
  {
    freezeTableName: true, //不增加复数表名
    sequelize, // 传递连接实例
    createdAt: false, //去掉
    updatedAt: false, //去掉
    modelName: 'users' // 我们需要选择模型名称
  }
)
// 定义的模型是类本身
if (users === sequelize.models.users) {
  console.info(green(`[models]:users:${users === sequelize.models.users}`))
} else {
  console.info(red(`[models]:users:${users === sequelize.models.users}`))
}
export { users }
