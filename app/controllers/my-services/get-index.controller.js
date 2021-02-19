'use strict'

const lodash = require('lodash')
const moment = require('moment')

const { response } = require('../../utils/response')
const serviceService = require('../../services/service.service')
const { filterGatewayAccountIds } = require('../../utils/permissions')
const getHeldPermissions = require('../../utils/get-held-permissions')

function hasLiveStripeAccount (gatewayAccounts) {
  return gatewayAccounts.some(gatewayAccount =>
    gatewayAccount.payment_provider === 'stripe' &&
    gatewayAccount.type === 'live')
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
      JSON.parse(cookies.govuk_pay_notifications).my_services_default_page_dismissed
  } catch (err) {
    // malformed cookie - continue
    return false
  }
}

function shouldShowNotification (isMyServicesDefaultView, cookies) {
  let isBeforeEndDate = true
  if (process.env.MY_SERVICES_DEFAULT_NOTIFICATION_END_DATE) {
    const notificationEndDate = moment.unix(process.env.MY_SERVICES_DEFAULT_NOTIFICATION_END_DATE)
    isBeforeEndDate = moment().isBefore(notificationEndDate)
  }
  return isMyServicesDefaultView && isBeforeEndDate && !isNotificationDismissed(cookies)
}

module.exports = async function getServiceList (req, res) {
  const servicesRoles = lodash.get(req, 'user.serviceRoles', [])
  const newServiceId = req.query && req.query.s

  const isMyServicesDefaultView = process.env.ENABLE_MY_SERVICES_AS_DEFAULT_VIEW === 'true'

  const aggregatedGatewayAccountIds = servicesRoles
    .flatMap(servicesRole => servicesRole.service.gatewayAccountIds)

  const aggregatedGatewayAccounts = await serviceService.getGatewayAccounts(aggregatedGatewayAccountIds, req.correlationId)
  const servicesData = servicesRoles
    .map(serviceRole => {
      const gatewayAccounts = aggregatedGatewayAccounts.filter(gatewayAccount =>
        serviceRole.service.gatewayAccountIds.includes(gatewayAccount.id.toString()))
      const serviceData = {
        name: serviceRole.service.name === 'System Generated' ? 'Temporary Service Name' : serviceRole.service.name,
        id: serviceRole.service.id,
        external_id: serviceRole.service.externalId,
        gatewayAccounts: lodash.sortBy(gatewayAccounts, 'type', 'asc'),
        permissions: getHeldPermissions(serviceRole.role.permissions.map(permission => permission.name))
      }
      return serviceData
    })
    .sort((a, b) => {
      if (isMyServicesDefaultView) {
        return sortServicesByLiveThenName(a, b)
      } else {
        return a.id - b.id
      }
    })

  const data = {
    services: servicesData,
    services_singular: servicesData.length === 1,
    env: process.env,
    has_account_with_payouts: hasLiveStripeAccount(aggregatedGatewayAccounts),
    has_live_account: filterGatewayAccountIds(aggregatedGatewayAccounts, true).length,
    show_whats_new_notification: shouldShowNotification(isMyServicesDefaultView, req.cookies)
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
