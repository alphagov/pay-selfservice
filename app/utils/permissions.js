'use strict'
const _ = require('lodash')
const { ConnectorClient } = require('../services/clients/connector_client.js')
const { isADirectDebitAccount } = require('./../services/clients/direct_debit_connector_client')
const client = new ConnectorClient(process.env.CONNECTOR_URL)

const userServicesContainsGatewayAccount = function userServicesContainsGatewayAccount (accountId, user) {
  const gatewayAccountIds = _.flattenDeep(_.concat(user.serviceRoles.map(serviceRole => serviceRole.service.gatewayAccountIds)))
  return accountId && gatewayAccountIds.indexOf(accountId) !== -1
}

const getLiveGatewayAccountsFor = async function getLiveGatewayAccountsFor (user, permissionName) {
  const userGatewayAccounts = await fetchGatewayAccountsFor(user, permissionName)

  return {
    gatewayAccountIds: getLiveGatewayAccountIds(userGatewayAccounts),
    headers: getAllAccountDetailHeaders(userGatewayAccounts)
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

const getLiveGatewayAccountIds = function getLiveGatewayAccountIds (gatewayAccounts) {
  return gatewayAccounts
    .filter((account) => account.type === 'live')
    .map((account) => account.gateway_account_id)
}

module.exports = {
  userServicesContainsGatewayAccount,
  getLiveGatewayAccountsFor
}
