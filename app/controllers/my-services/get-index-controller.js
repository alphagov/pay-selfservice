'use strict'

// NPM dependencies
const _ = require('lodash')

// local dependencies
const { response } = require('../../utils/response')
const serviceService = require('../../services/service_service')
const getHeldPermissions = require('../../utils/get_held_permissions')
const { getLiveGatewayAccountIds } = require('../../utils/permissions')

const hasAccountWithPayouts = function hasLiveStripeAccount (gatewayAccounts) {
  return gatewayAccounts.some(gatewayAccount =>
    !isDirectDebitAccount(gatewayAccount) &&
    gatewayAccount.payment_provider === 'stripe' &&
    gatewayAccount.type === 'live')
}

const isDirectDebitAccount = function isDirectDebitAccount (gatewayAccount) {
  return gatewayAccount.payment_method === 'direct debit'
}

module.exports = async (req, res) => {
  const servicesRoles = _.get(req, 'user.serviceRoles', [])
  const newServiceId = _.get(req, 'query.s')

  const aggregatedGatewayAccountIds = servicesRoles
    .map(servicesRole => servicesRole.service.gatewayAccountIds)
    .reduce((accumulator, currentValue) => { return accumulator.concat(currentValue) }, [])

  const aggregatedGatewayAccounts = await serviceService.getGatewayAccounts(aggregatedGatewayAccountIds, req.correlationId)

  const servicesData = servicesRoles.map(serviceRole => {
    // For Direct Debit currently we initialise req.user.serviceRoles[].service.gatewayAccountIds with external ids,
    // but for Cards we initialise with internal ids.
    // We check the gateway accounts' external id first as not to overlap/skip between card payment and direct debit gateway accounts.
    const gatewayAccounts =
      aggregatedGatewayAccounts.filter(gatewayAccount => serviceRole.service.gatewayAccountIds.includes(gatewayAccount.external_id.toString()) ||
        serviceRole.service.gatewayAccountIds.includes(gatewayAccount.id.toString()))
    const cardAccounts = gatewayAccounts.filter(gatewayAccount => !isDirectDebitAccount(gatewayAccount))
    const directdebitAccounts = gatewayAccounts.filter(isDirectDebitAccount)
    const payload = {
      name: serviceRole.service.name === 'System Generated' ? 'Temporary Service Name' : serviceRole.service.name,
      external_id: serviceRole.service.externalId,
      gateway_accounts: {
        cardAccounts: _.sortBy(cardAccounts, 'type', 'asc'),
        directdebitAccounts
      },
      permissions: getHeldPermissions(serviceRole.role.permissions.map(permission => permission.name))
    }
    return payload
  })

  const data = {
    services: servicesData,
    services_singular: servicesData.length === 1,
    env: process.env,
    has_account_with_payouts: hasAccountWithPayouts(aggregatedGatewayAccounts),
    has_live_account: getLiveGatewayAccountIds(aggregatedGatewayAccounts).length
  }
  if (newServiceId) {
    servicesData.filter(serviceData => {
      return serviceData.external_id === newServiceId
    }).forEach(service => {
      data.new_service_name = service.name
    })
  }

  return response(req, res, 'services/index', data)
}
