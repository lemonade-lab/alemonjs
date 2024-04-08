#!/usr/bin/env sh

set -e

rm -rf lib
rm -rf types

npm run tsc

# test

node lib/index.js