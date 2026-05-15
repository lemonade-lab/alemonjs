# [https://alemonjs.com/](https://alemonjs.com/)

提供 Redis 和 Sequelize 连接。

当前 SQL 方言支持：

- `pgsql`
- `mysql`
- `sqlite`

```ts
import { getIoRedis, getSequelize } from '@alemonjs/db';

export const Redis = getIoRedis();
export const sequelize = getSequelize();
```

## 安装

```sh
yarn add @alemonjs/db -W
```

`@alemonjs/db` 不再内置 SQL 驱动。  
如果你要使用 SQL 能力，需要按实际方言额外安装对应包：

```sh
# PostgreSQL
yarn add pg -W

# MySQL
yarn add mysql2 -W

# SQLite
yarn add sqlite3 -W
```

## 方言选择规则

### 1. 代码显式传入 `dialect`

```ts
const sequelize = getSequelize({
  dialect: 'pgsql'
});
```

优先级最高。

- 如果对应驱动已安装，直接使用该方言
- 如果对应驱动未安装，不会立即中断
- 会打印 `warn`
- 然后尝试回退到 `sqlite`
- 如果 `sqlite3` 也未安装，则提示当前环境无法使用 SQL 能力

### 2. 配置文件显式写了 `db.dialect`

```yaml
db:
  dialect: pgsql
```

语义与代码显式指定一致：

- 缺驱动时打印 `warn`
- 尝试回退到 `sqlite`
- 如果 `sqlite3` 也不可用，则提示无法使用

### 3. 完全未指定 `dialect`

框架会自动探测：

1. 已配置且可用的 `pgsql`
2. 已配置且可用的 `mysql`
3. `sqlite`

如果一个可用 SQL 驱动都没有，则提示安装：

- `pg`
- `mysql2`
- `sqlite3`

## 配置示例

### PostgreSQL

```yaml
db:
  dialect: pgsql
  pgsql:
    host: '127.0.0.1'
    port: 5432
    user: 'postgres'
    password: 'Postgres123456!'
    database: 'alemonjs'
  redis:
    host: '127.0.0.1'
    port: 6379
    password: ''
    db: 0
```

### MySQL

```yaml
db:
  dialect: mysql
  mysql:
    host: '127.0.0.1'
    port: 3306
    user: 'root'
    password: 'Mysql123456!'
    database: 'alemonjs'
```

### SQLite

```yaml
db:
  dialect: sqlite
  sqlite:
    storage: './data/alemonapp.db'
```

## 使用示例

```ts
import { getSequelize } from '@alemonjs/db';

export const sequelize = getSequelize({
  dialect: 'pgsql'
});
```

如果你明确写了 `dialect: 'pgsql'`，但没有安装 `pg`，框架会：

1. 打印 warning
2. 尝试使用 `sqlite`
3. 若 `sqlite3` 也未安装，则提示无法使用 SQL 能力

## Redis 说明

Redis 仍然内置使用 `ioredis`，不需要额外安装驱动。
