#### 可能出现的问题

1.使用`npm run start`后发现没有生效

或提示`pm2 Modules with id set not found`

```
pm2 update  #更新最新版
pm2 kill   #杀死所有进程
rm -rf ~/.pm2  #删除后重新启动即可
```

2.环境变量问题导致的 pm2 启动失败

```
pm2 env #检查
```

```
pm2 env set PATH "./node_modules/.bin:$PATH"  #添加
```

#### 问题反馈

开发交流地 806943302
