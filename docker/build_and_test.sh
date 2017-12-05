#!/usr/bin/env bash

rm -rf node_modules &&\
ln -s /tmp/node_modules /app/node_modules &&\
npm run compile &&\
npm run lint &&\
npm test -- --forbid-only --forbid-pending &&\
rm -rf node_modules