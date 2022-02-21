'use strict'

const lodash = require('lodash')
const moment = require('moment')

const { response } = require('../../utils/response')
const serviceService = require('../../services/service.service')
const { filterGatewayAccountIds } = require('../../utils/permissions')
const getHeldPermissions = require('../../utils/get-held-permissions')
const { DEFAULT_SERVICE_NAME } = require('../../utils/constants')
const showNewContractTermsBannerUntilDate = process.env.SHOW_NEW_CONTRACTS_BANNER_UNTIL_DATE || '1647907200'

function hasStripeAccount (gatewayAccounts) {
  return gatewayAccounts.some(gatewayAccount =>
    gatewayAccount.payment_provider === 'stripe')
}

function sortServicesByLiveThenName (a, b) {
  const aHasLive = a.gatewayAccounts.some(account => account.type === 'live')
  const bHasLive = b.gatewayAccounts.some(account => account.type === 'live')
  const aName = a.name.toLowerCase()
  const bName = b.name.toLowerCase()

  // live comes before test, then sort by name ascending
  if (aHasLive && !bHasLive) { return -1 }
  if (!aHasLive && bHasLive) { return 1 }
  if (aName < bName) { return -1 }
  if (aName > bName) { return 1 }
  return 0
}

function isNotificationDismissed (cookies) {
  try {
    return cookies.govuk_pay_notifications &&
      JSON.parse(cookies.govuk_pay_notifications).new_contract_terms_banner_dismissed
  } catch (err) {
    // malformed cookie - continue
    return false
  }
}

function shouldShowNewContractTermsBanner (cookies) {
  let isCurrentDateBeforeNotificationEndDate = true

  const notificationEndDate = moment.unix(showNewContractTermsBannerUntilDate)
  isCurrentDateBeforeNotificationEndDate = moment().isBefore(notificationEndDate)

  return isCurrentDateBeforeNotificationEndDate && !isNotificationDismissed(cookies)
}

module.exports = async function getServiceList (req, res) {
  const servicesRoles = lodash.get(req, 'user.serviceRoles', [])
  const newServiceId = res.locals.flash && res.locals.flash.inviteSuccessServiceId &&
    res.locals.flash.inviteSuccessServiceId[0]

  const aggregatedGatewayAccountIds = servicesRoles
    .flatMap(servicesRole => servicesRole.service.gatewayAccountIds)

  const aggregatedGatewayAccounts = await serviceService.getGatewayAccounts(aggregatedGatewayAccountIds, req.correlationId)
  const servicesData = servicesRoles
    .map(serviceRole => {
      const gatewayAccounts = aggregatedGatewayAccounts.filter(gatewayAccount =>
        serviceRole.service.gatewayAccountIds.includes(gatewayAccount.id.toString()))
      const isAdminUser = req.user.isAdminUserForService(serviceRole.service.externalId)

      const serviceData = {
        name: serviceRole.service.name === DEFAULT_SERVICE_NAME ? 'Temporary Service Name' : serviceRole.service.name,
        id: serviceRole.service.id,
        external_id: serviceRole.service.externalId,
        gatewayAccounts: lodash.sortBy(gatewayAccounts, 'type', 'asc'),
        permissions: getHeldPermissions(serviceRole.role.permissions.map(permission => permission.name)),
        isAdminUser: isAdminUser
      }
      return serviceData
    })
    .sort((a, b) => sortServicesByLiveThenName(a, b))

  const isAdminUserForALiveService = servicesData.some(serviceData => {
    const hasLiveGatewayAccount = serviceData.gatewayAccounts.filter(gatewayAccount => gatewayAccount.type === 'live')
    return hasLiveGatewayAccount && serviceData.isAdminUser
  })

  const data = {
    services: servicesData,
    services_singular: servicesData.length === 1,
    env: process.env,
    has_account_with_payouts: hasStripeAccount(aggregatedGatewayAccounts),
    has_live_account: filterGatewayAccountIds(aggregatedGatewayAccounts, true).length,
    show_new_contract_terms_banner: isAdminUserForALiveService && shouldShowNewContractTermsBanner(req.cookies)
  }
  if (newServiceId) {
    servicesData.find(service => {
      if (service.external_id === newServiceId) {
        data.new_service_name = service.name
        return true
      }
    })
  }

  return response(req, res, 'services/index', data)
}
