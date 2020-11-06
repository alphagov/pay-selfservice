'use strict'
const _ = require('lodash')
const { ConnectorClient } = require('../services/clients/connector.client.js')
const { isADirectDebitAccount } = require('../services/clients/direct-debit-connector.client')
const client = new ConnectorClient(process.env.CONNECTOR_URL)

const userServicesContainsGatewayAccount = function userServicesContainsGatewayAccount (accountId, user) {
  const gatewayAccountIds = _.flattenDeep(_.concat(user.serviceRoles.map(serviceRole => serviceRole.service.gatewayAccountIds)))
  return accountId && gatewayAccountIds.indexOf(accountId) !== -1
}

const getLiveGatewayAccountsFor = async function getLiveGatewayAccountsFor (user, permissionName, isLive = true) {
  const userGatewayAccounts = await fetchGatewayAccountsFor(user, permissionName)

  return {
    gatewayAccountIds: getLiveGatewayAccountIds(userGatewayAccounts, isLive),
    headers: getAllAccountDetailHeaders(userGatewayAccounts),
    _gateway_accounts: userGatewayAccounts
  }
}

const fetchGatewayAccountsFor = function fetchGatewayAccountsFor (user, permissionName) {
  const gatewayAccountIds = user.serviceRoles
    .filter((serviceRole) => serviceRole.role.permissions
      .map((permission) => permission.name)
      .includes(permissionName)
    )
    .flatMap(servicesRole => servicesRole.service.gatewayAccountIds)
    .reduce((accumulator, currentValue) => accumulator.concat(currentValue), [])
    .filter(gatewayAccountId => !isADirectDebitAccount(gatewayAccountId))

  return gatewayAccountIds.length
    ? client.getAccounts({ gatewayAccountIds }).then((result) => result.accounts)
    : Promise.resolve([])
}

const getAllAccountDetailHeaders = function getAllAccountDetailHeaders (gatewayAccounts) {
  const shouldGetStripeHeaders = gatewayAccounts
    .some((account) => account.payment_provider === 'stripe')

  const shouldGetMotoHeaders = gatewayAccounts
    .some((account) => account.allow_moto)

  return {
    shouldGetMotoHeaders, shouldGetStripeHeaders
  }
}

const getLiveGatewayAccountIds = function getLiveGatewayAccountIds (gatewayAccounts, isLive = true) {
  const checkAgainst = isLive ? 'live' : 'test'
  return gatewayAccounts
    .filter((account) => account.type === checkAgainst)
    .map((account) => account.gateway_account_id)
}

module.exports = {
  userServicesContainsGatewayAccount,
  getLiveGatewayAccountsFor,
  getLiveGatewayAccountIds
}
