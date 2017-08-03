let _ = require('lodash')
const getHeldPermissions = require('./get_held_permissions')
const {serviceNavigationItems, adminNavigationItems} = require('./navBuilder')

const showSettingsNavTemplates = [
  'token',
  'token_generate',
  'credentials',
  'provider_credentials/epdq',
  'provider_credentials/sandbox',
  'provider_credentials/smartpay',
  'provider_credentials/worldpay',
  'service_name',
  'payment_types_summary',
  'payment_types_select_type',
  'payment_types_select_brand',
  '3d_secure/index',
  '3d_secure/on_confirm',
  'email_notifications/index',
  'email_notifications/off_confirm',
  'email_notifications/edit',
  'email_notifications/confirm'
]

const hideServiceNavTemplates = [
  'services/index',
  'services/edit_service_name',
  'services/add_service',
  'services/team_members',
  'services/team_member_invite',
  'services/team_member_details',
  'services/team_member_profile',
  'services/team_member_permissions'
]

/**
 * converts users permission array of form
 *
 * [
 * 'permission-type:operation',
 * ...
 *
 * ]
 *
 * to object of form
 *
 * {
 *   'permission_type_operation': true,
 *   ...
 *
 * }
 *
 * @param user
 * @returns {object}
 */
const getPermissions = (user, service) => {
  if (service) {
    let userPermissions
    const permissionsForService = user.getPermissionsForService(service.externalId)
    if (user && permissionsForService) {
      userPermissions = _.clone(permissionsForService)
      return getHeldPermissions(userPermissions)
    }
  }
}

const showSettingsNav = template => {
  return showSettingsNavTemplates.indexOf(template) !== -1
}

const hideServiceNav = template => {
  return hideServiceNavTemplates.indexOf(template) !== -1
}

const addGatewayAccountProviderDisplayNames = data => {
  let gatewayAccounts = _.get(data, 'gatewayAccounts', null)
  if (gatewayAccounts) {
    let convertedGateWayAccounts = gatewayAccounts.map(gatewayAccount => {
      if (gatewayAccount.payment_provider) {
        gatewayAccount.payment_provider_display_name = _.startCase(gatewayAccount.payment_provider)
      }
      return gatewayAccount
    })
    data.gatewayAccounts = convertedGateWayAccounts
  }
}

const getAccount = account => {
  if (account) {
    account.full_type = account.type === 'test'
      ? [account.payment_provider, account.type].join(' ')
      : account.type
  }

  return account
}

module.exports = function (req, data, template) {
  let convertedData = _.clone(data)
  let user = req.user
  let account = req.account
  let originalUrl = req.originalUrl
  let permissions = getPermissions(user, req.service)
  convertedData.permissions = permissions
  convertedData.showSettingsNav = showSettingsNav(template)
  convertedData.hideServiceNav = hideServiceNav(template)
  addGatewayAccountProviderDisplayNames(convertedData)
  convertedData.currentGatewayAccount = getAccount(account)
  convertedData.currentServiceName = _.get(req, 'account.service_name')
  if (permissions) {
    convertedData.serviceNavigationItems = serviceNavigationItems(originalUrl, permissions)
    convertedData.adminNavigationItems = adminNavigationItems(originalUrl, permissions)
  }
  return convertedData
}
