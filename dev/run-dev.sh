#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR/..

export PORT=9400
export SESSION_ENCRYPTION_KEY=asdjhbwefbo23r23rbfik2roiwhefwbqw
export PUBLIC_AUTH_URL=http://dockerhost:9600/v1/frontend/auth
export CONNECTOR_URL=http://dockerhost:9300


npm run start
