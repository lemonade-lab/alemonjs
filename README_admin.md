#### 可能出现的问题

`Cannot use import statement outside a module`
`1|alemon   | import './src/lib/consolo'`

```
pm2 kill #杀死实例
```

`npm run start` 未启动
`pm2 Modules with id set not found`

```
pm2 update  #更新最新版
pm2 kill   #杀死所有进程
rm -rf ~/.pm2  #删除后重新启动即可
```

PM2 安装环境出错

```
pm2 env #检查
```

```
pm2 env set PATH "./node_modules/.bin:$PATH"  #添加
```

#### 问题反馈

开发交流地 806943302
