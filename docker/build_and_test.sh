#!/usr/bin/env bash
set -ueo pipefail
rm -rf node_modules
cp -R /tmp/node_modules /app/node_modules
npm run compile
# disabled while promise rejections not returning error objects need to be addressed
npm run lint
npm test -- --forbid-only --forbid-pending
# prevent publish of any pacts with 'to-be' in their name
for i in ./pacts/*-to-be-*.json; do mv "$i" "${i%.json}.ignore"; done
npm run publish-pacts
