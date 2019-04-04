#!/bin/sh

set -eu

# Add custom TLS certificates from $CERTS_PATH if it's been set and isn't the
# default source for CA certificates
if [ "${CERTS_PATH:-/etc/ssl/certs}" != /etc/ssl/certs ]; then
  for cert in "$CERTS_PATH"/*; do
    if [ -f "$cert" ]; then
      cp -v "$cert" /etc/ssl/certs
    fi
  done
  echo "$0: Ignore the following warning about ca-certificates.crt" >&2
  c_rehash /etc/ssl/certs
fi

npm start
