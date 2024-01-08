#!/usr/bin/env sh

set -e

rm -rf lib
rm -rf types

npm run tsc

cp -rf src/villa/sdk/proto lib/villa/sdk/proto

# test

node lib/index.js
