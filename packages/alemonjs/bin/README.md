## alemonc

使用指令来编辑 alemon.config.yaml

- add

lemonc add apps alemonjs-xianyu alemonjs-openai

```yaml
apps:
  - 'alemonjs-xianyu'
  - 'alemonjs-openai'
```

- remove

lemonc remove apps alemonjs-openai

```yaml
apps:
  - 'alemonjs-openai'
```

- set

lemonc set login qq

```yaml
apps:
  - 'alemonjs-openai'
login: 'qq'
```

lemonc set discord.token 123456

```yaml
apps:
  - 'alemonjs-openai'
login: 'qq'
discord:
  token: 123456
```

- del

lemonc del discord

```yaml
apps:
  - 'alemonjs-openai'
login: 'qq'
```
