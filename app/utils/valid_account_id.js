'use strict'
const _ = require('lodash')
const { ConnectorClient } = require('../services/clients/connector_client.js')
const { isADirectDebitAccount } = require('./../services/clients/direct_debit_connector_client')
const client = new ConnectorClient(process.env.CONNECTOR_URL)

const userServicesContainsGatewayAccount = function userServicesContainsGatewayAccount (accountId, user) {
  const gatewayAccountIds = _.flattenDeep(_.concat(user.serviceRoles.map(serviceRole => serviceRole.service.gatewayAccountIds)))
  return accountId && gatewayAccountIds.indexOf(accountId) !== -1
}

const liveUserServicesGatewayAccounts = async function liveUserServicesGatewayAccounts (user) {
  const gatewayAccountIds = user.serviceRoles
    .flatMap(servicesRole => servicesRole.service.gatewayAccountIds)
    .reduce((accumulator, currentValue) => accumulator.concat(currentValue), [])
    .filter(gatewayAccountId => !isADirectDebitAccount(gatewayAccountId))

  const accounts = await client.getAccounts({ gatewayAccountIds })
    .then((result) => result.accounts)

  return accounts
    .filter((account) => account.type === 'live')
    .map((account) => account.gateway_account_id)
    .join(',')
}

module.exports = {
  userServicesContainsGatewayAccount,
  liveUserServicesGatewayAccounts
}
