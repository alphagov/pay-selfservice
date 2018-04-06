#!/usr/bin/env bash

if [ -d "pay-adminusers" ]; then
  rm -rf pay-adminusers
fi

git clone git@github.com:alphagov/pay-adminusers.git
cd pay-adminusers
git checkout PP-Test-Pact-Versioning
branch=$(git rev-parse --abbrev-ref HEAD)

mvn test -Dtest=uk.gov.pay.adminusers.pact.UsersApiTest -DargLine="-Dpact.provider.version=${branch}" -DpactTags=$3 -DpactBrokerUsername=$1 -DpactBrokerPassword=$2 -DpactBrokerHost=governmentdigitalservice.pact.dius.com.au -DpactBrokerPort=443