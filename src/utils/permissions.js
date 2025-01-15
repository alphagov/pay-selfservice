'use strict'
const _ = require('lodash')
const { ConnectorClient } = require('../services/clients/connector.client.js')
const client = new ConnectorClient(process.env.CONNECTOR_URL)

const userServicesContainsGatewayAccount = function userServicesContainsGatewayAccount (accountId, user) {
  const gatewayAccountIds = _.flattenDeep(_.concat(user.serviceRoles.map(serviceRole => serviceRole.service.gatewayAccountIds)))
  return accountId && gatewayAccountIds.indexOf(accountId) !== -1
}

const getGatewayAccountsFor = async function getGatewayAccountsFor (user, filterLiveAccounts, permissionName) {
  const userGatewayAccounts = await fetchGatewayAccountsFor(user, permissionName)

  return {
    gatewayAccountIds: filterGatewayAccountIds(userGatewayAccounts, filterLiveAccounts),
    headers: getAllAccountDetailHeaders(userGatewayAccounts),
    hasLiveAccounts: filterGatewayAccountIds(userGatewayAccounts, true).length > 0,
    hasStripeAccount: hasStripeAccount(userGatewayAccounts, filterLiveAccounts),
    hasRecurringAccount: hasRecurringAccount(userGatewayAccounts, filterLiveAccounts),
    hasTestStripeAccount: userGatewayAccounts.filter((account) => account.type === 'test' && account.payment_provider === 'stripe').length > 0
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

const filterGatewayAccountIds = function filterGatewayAccountIds (gatewayAccounts, filterLiveAccounts = true) {
  const gatewayAccountTypeFilter = filterLiveAccounts ? 'live' : 'test'
  return gatewayAccounts
    .filter((account) => account.type === gatewayAccountTypeFilter)
    .map((account) => account.gateway_account_id)
}

const hasStripeAccount = function hasStripeAccount (gatewayAccounts, filterLiveAccounts = true) {
  const gatewayAccountTypeFilter = filterLiveAccounts ? 'live' : 'test'
  return gatewayAccounts
    .filter((account) => account.type === gatewayAccountTypeFilter)
    .filter((account) => account.payment_provider === 'stripe')
    .length > 0
}

const hasRecurringAccount = function hasRecurringAccount (gatewayAccounts, filterLiveAccounts = true) {
  const gatewayAccountTypeFilter = filterLiveAccounts ? 'live' : 'test'
  return gatewayAccounts.filter((account) => account.type === gatewayAccountTypeFilter)
    .some((account) => account.recurring_enabled)
}

module.exports = {
  userServicesContainsGatewayAccount,
  getGatewayAccountsFor,
  filterGatewayAccountIds
}
