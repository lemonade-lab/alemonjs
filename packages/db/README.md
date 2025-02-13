# [https://alemonjs.com/](https://alemonjs.com/)

提供 redis 和 sequelize mysql 连接

```sh
yarn add @alemonjs/db
```

- alemon.config.yaml

```yaml
redis:
  host: '127.0.0.1'
  port: '6379'
  password: 'Mm002580'
  db: '0'
mysql:
  host: '127.0.0.1'
  port: '3306'
  user: 'root'
  password: 'Mm002580!'
  database: 'alemonjs'
```

- use

```ts
import { getIoRedis, getSequelize } from '@alemonjs/db'
// redis
export const Redis = getIoRedis()
// seuqlieze mysql
export const sequelize = getSequelize()
```

- docker

```sh
cd node_modules/@alemonjs/db
```

start

```sh
docker-compose up -d
```

list

```sh
docker-compose ps
```

stop

```sh
docker-compose down
```
