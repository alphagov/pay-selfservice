'use strict'
const _ = require('lodash')
const { isADirectDebitAccount } = require('./../services/clients/direct_debit_connector_client')

const userServicesContainsGatewayAccount = function userServicesContainsGatewayAccount (accountId, user) {
  const gatewayAccountIds = _.flattenDeep(_.concat(user.serviceRoles.map(serviceRole => serviceRole.service.gatewayAccountIds)))
  return accountId && gatewayAccountIds.indexOf(accountId) !== -1
}

const liveUserServicesGatewayAccounts = function liveUserServicesGatewayAccounts (user) {
  return user.serviceRoles
    .flatMap(servicesRole => servicesRole.service.gatewayAccountIds)
    .reduce((accumulator, currentValue) => accumulator.concat(currentValue), [])
    .filter(gatewayAccountId => !isADirectDebitAccount(gatewayAccountId))
    .join(',')
}

module.exports = {
  userServicesContainsGatewayAccount,
  liveUserServicesGatewayAccounts
}
