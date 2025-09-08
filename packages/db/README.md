# [https://alemonjs.com/](https://alemonjs.com/)

提供 redis 和 sequelize mysql 连接

```ts
import { getIoRedis, getSequelize } from '@alemonjs/db';
// redis
export const Redis = getIoRedis();
// seuqlieze mysql
export const sequelize = getSequelize();
```

## 使用说明

```sh
yarn add @alemonjs/db -W
```

- alemon.config.yaml

```yaml
redis:
  host: '127.0.0.1'
  port: '6379'
  password: ''
  db: '0'
mysql:
  host: '127.0.0.1'
  port: '3306'
  user: 'root'
  password: 'Mm002580!'
  database: 'alemonjs'
```

- use

### docker

- 添加国内镜像

> Settings > Docker Engine

```json
{
  "registry-mirrors": ["https://registry.cn-hangzhou.aliyuncs.com"]
}
```

- 新增文件 docker-compose.yml

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: mysql-container
    environment:
      # 密码 Mm002580!
      # 用户 root
      MYSQL_ROOT_PASSWORD: 'Mm002580!'
      MYSQL_ROOT_HOST: '%'
      MYSQL_ALLOW_EMPTY_PASSWORD: 'yes'
    ports:
      - '3306:3306'
    command: --default-authentication-plugin=mysql_native_password
    volumes:
      - ./init.sql:/docker-entrypoint-initdb.d/docker-dbinit.sql
  redis:
    image: redis:6.2-alpine
    container_name: redis-container
    ports:
      - '6379:6379'
```

- 新增文件 docker-dbinit.sql

```sql
-- 数据库名称：alemonjs
CREATE DATABASE IF NOT EXISTS `alemonjs`
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;
```

- 启动

```sh
docker-compose up -d
```
