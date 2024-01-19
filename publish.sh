#!/usr/bin/env sh

set -e

rm -rf lib
rm -rf types

npm run tsc

cp -rf src/platform/villa/sdk/proto lib/platform/villa/sdk/proto

# test

node lib/index.js
