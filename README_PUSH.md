# 推送

```json
{
  "push": "yarn build && lerna publish from-package --yes",
  "push:patch": "lerna version patch --yes && yarn push",
  "push:minor": "lerna version minor --yes && yarn push",
  "push:major": "lerna version major --yes && yarn push"
}
```