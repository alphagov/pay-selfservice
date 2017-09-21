#!/usr/bin/env bash

echo ''
echo ''
grep -rnw './test' -e 'it.only' && echo '' && echo 'ERROR: it.only() found in tests, Exiting' && exit 1
grep -rnw './test' -e 'describe.only' && echo '' && echo 'ERROR: describe.only() found in tests, Exiting' && exit 1
grep -rnw './test' -e 'context.only' && echo '' && echo 'ERROR: context.only() found in tests, Exiting' && exit 1

if [ -d "node_modules" ]; then
    npm rebuild
    npm --prefer-offline install
else
    mkdir -p /app &&\
    cp -a /tmp/node_modules /app/
fi

npm run compile && npm test && npm prune --production

