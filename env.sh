#!/bin/bash
ENV_FILE="$WORKSPACE/pay-scripts/services/selfservice.env"
if [ -f $ENV_FILE ]
then
  set -a
  source $ENV_FILE
  set +a  
fi
$@