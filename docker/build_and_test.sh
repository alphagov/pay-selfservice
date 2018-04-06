#!/usr/bin/env bash

if [ -d "pact" ]; then
  rm -rf pact
fi
rm -rf node_modules &&\
ln -s /tmp/node_modules /app/node_modules &&\
npm run compile &&\
npm run lint &&\
npm test -- --forbid-only --forbid-pending
npm run publish