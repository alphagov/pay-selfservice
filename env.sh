#!/bin/bash
ENV_FILE="$WORKSPACE/pay-scripts/services/selfservice.env"
if [ -f $ENV_FILE ]
then
  set -a
  source $ENV_FILE
  set +a  
fi

export CERTS_PATH=$WORKSPACE/pay-scripts/services/ssl/certs
export PGSSLROOTCERT=$CERTS_PATH/selfservice.db.pymnt.localdomain.crt

# Adding this so we can make self-service talk to auth-stubs deployed in a different environment i.e. heroku.
# Otherwise self-service fails to acquire the issuer cert and fails the auth process. This is only for development
# environments and this is why we have it in this file. This should NOT be copied to pay-scripts.
export NODE_TLS_REJECT_UNAUTHORIZED=0

eval "$@"
