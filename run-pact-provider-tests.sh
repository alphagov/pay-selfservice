#!/usr/bin/env bash

git clone git@github.com:alphagov/pay-adminusers.git
cd pay-adminusers
git checkout PP-Test-Pact-Versioning

mvn test -Dtest=uk.gov.pay.adminusers.pact.UsersApiTest -DpactTags=$3 -DpactBrokerUsername=$1 -DpactBrokerPassword=$2 -DpactBrokerHost=governmentdigitalservice.pact.dius.com.au -DpactBrokerPort=443