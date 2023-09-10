#!/bin/sh

ENV_FILE=.env

# remove existing environment files
rm -f "$ENV_FILE"
touch "$ENV_FILE"

read -r -d '' URL_TARGET_LOCAL << EOM
ADMINUSERS_URL=http://127.0.0.1:9700
CONNECTOR_URL=http://127.0.0.1:9300
PRODUCTS_URL=http://127.0.0.1:18000
LEDGER_URL=http://127.0.0.1:10700
PUBLIC_AUTH_BASE=http://127.0.0.1:9600
PUBLIC_AUTH_URL=http://127.0.0.1:9600/v1/frontend/auth
WEBHOOKS_URL=http://127.0.0.1:10800
EOM

read -r -d '' URL_TARGET_TUNNEL << EOM
ADMINUSERS_URL=https://127.0.0.1:9001
CONNECTOR_URL=https://127.0.0.1:9003
PRODUCTS_URL=https://127.0.0.1:9005
LEDGER_URL=https://127.0.0.1:9007
PUBLIC_AUTH_BASE=http://127.0.0.1:9006
PUBLIC_AUTH_URL=http://127.0.0.1:9006/v1/frontend/auth
WEBHOOKS_URL=https://127.0.0.1:9008
EOM

read -r -d '' URL_TARGET_DOCKER_TUNNEL << EOM
ADMINUSERS_URL=https://docker.for.mac.127.0.0.1:9001
CONNECTOR_URL=https://docker.for.mac.127.0.0.1:9003
PRODUCTS_URL=https://docker.for.mac.127.0.0.1:9005
LEDGER_URL=https://docker.for.mac.127.0.0.1:9007
PUBLIC_AUTH_BASE=https://docker.for.mac.127.0.0.1:9006
PUBLIC_AUTH_URL=https://docker.for.mac.127.0.0.1:9006/v1/frontend/auth
WEBHOOKS_URL=https://docker.for.mac.127.0.0.1:9008
EOM

if [ "$1" = 'local' ] ; then
  URL_MAP="$URL_TARGET_LOCAL"
elif [ "$1" = 'docker' ] ; then
  URL_MAP="$URL_TARGET_DOCKER_TUNNEL"
else
  URL_MAP="$URL_TARGET_TUNNEL"
fi

cat > "$ENV_FILE" << EOM
NODE_ENV=development
PORT=3000
DISABLE_INTERNAL_HTTPS=true
NODE_TLS_REJECT_UNAUTHORIZED=0
COOKIE_MAX_AGE=10800000
SESSION_ENCRYPTION_KEY=naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk
SESSION_IN_MEMORY=true
LOGIN_ATTEMPT_CAP=2
DISABLE_REQUEST_LOGGING=true
NODE_TEST_MODE=true
GOCARDLESS_TEST_CLIENT_ID=some-test-client-id
GOCARDLESS_LIVE_CLIENT_ID=some-live-client-id
GOCARDLESS_TEST_OAUTH_BASE_URL=https://connect-sandbox.gocardless.com
GOCARDLESS_LIVE_OAUTH_BASE_URL=https://connect-sandbox.gocardless.com
SELFSERVICE_URL=https://selfservice.pymnt.localdomain
ZENDESK_URL=https://govuk.zendesk.com/api/v2
STRIPE_HOST=127.0.0.1
STRIPE_PORT=8000
$URL_MAP
EOM
