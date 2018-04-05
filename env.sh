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

export PACT_CONSUMER_VERSION=5
export PACT_BROKER_USERNAME=Qdb1JETG8s9HZ0THcD55LZ2r15V7ZPt
export PACT_BROKER_PASSWORD=62VMf2Vjxh0szgnm0mjGgboPlDfJnAv
export PACT_CONSUMER_TAG=test-tag

eval "$@"
