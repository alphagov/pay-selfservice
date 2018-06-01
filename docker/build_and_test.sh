#!/usr/bin/env bash
set -ueo pipefail
npm run compile
npm run lint
npm test -- --forbid-only --forbid-pending
npm run publish-pacts
