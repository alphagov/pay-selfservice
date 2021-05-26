#!/bin/sh -l

username=$1
password=$2
consumer=$3
consumer_tag=$4

function pacts_already_verified(){
    can_deploy="$(pact-broker can-i-deploy \
      --pacticipant $consumer --version $consumer_tag \
      --broker_base_url https://pay-pact-broker.cloudapps.digital/ \
      --broker-username $username \
      --broker-password $password \
      --output json)"
    return $?
}

if pacts_already_verified; then
  echo "All $consumer pacts have already been verified"
  exit 0
fi

echo "can-i-deploy result:"
echo "$can_deploy"
providers=$(echo "$can_deploy" | \
  jq -r '.matrix[] | select(.verificationResult.success != true) | .provider.name ' | \
  tr '\n' ' ' | tr -d '"')

echo "Providers needing verification: $providers"

echo "::set-output name=providers-needing-validation::$providers"