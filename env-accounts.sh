#!/bin/bash
ENV_FILE="$WORKSPACE/pay-scripts/services/selfserviceaccounts.env"
if [ -f $ENV_FILE ]
then
  set -a
  source $ENV_FILE
  set +a
fi

export CERTS_PATH=$WORKSPACE/pay-scripts/services/ssl/certs
export PGSSLROOTCERT=$CERTS_PATH/selfservice.db.pymnt.localdomain.crt


eval "$@"
