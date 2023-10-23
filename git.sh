#!/usr/bin/env sh

# 获取传递的变量
variable="更新"

if [ "$1" ]; then
    variable=$1
fi

set -e

git init
git add .
git commit -m "$variable"

git push
