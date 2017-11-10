#!/usr/bin/env bash

echo ''
echo ''
grep -rnw './test' -e 'it.only' && echo '' && echo 'ERROR: it.only() found in tests, Exiting' && exit 1
grep -rnw './test' -e 'describe.only' && echo '' && echo 'ERROR: describe.only() found in tests, Exiting' && exit 1
grep -rnw './test' -e 'context.only' && echo '' && echo 'ERROR: context.only() found in tests, Exiting' && exit 1

rm -rf node_modules &&\
ln -s /tmp/node_modules /app/node_modules &&\
npm run compile &&\
npm test &&\
rm -rf node_modules