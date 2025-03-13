## alemonc

使用指令来编辑 alemon.config.yaml

- help

```sh
npx alemonc -h
```

- add

```sh
alemonc add apps alemonjs-xianyu alemonjs-openai
```

```yaml
apps:
  - 'alemonjs-xianyu'
  - 'alemonjs-openai'
```

- remove

```sh
alemonc remove apps alemonjs-openai
```

```yaml
apps:
  - 'alemonjs-openai'
```

- set

```sh
alemonc set login qq
```

```yaml
apps:
  - 'alemonjs-openai'
login: 'qq'
```

```sh
alemonc set discord.token 123456
```

```yaml
apps:
  - 'alemonjs-openai'
login: 'qq'
discord:
  token: 123456
```

- del

```sh
alemonc del discord
```

```yaml
apps:
  - 'alemonjs-openai'
login: 'qq'
```
