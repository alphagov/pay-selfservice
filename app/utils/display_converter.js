let _ = require('lodash')
const getHeldPermissions = require('./get_held_permissions')

const hideNavBarTemplates = [
  'transactions/index',
  'login/logged_in',
  'services/index',
  'services/team_members',
  'services/team_member_details',
  'services/team_member_profile',
  'services/team_member_permissions',
  'services/team_member_invite',
  'error_logged_in',
  'services/edit_service_name',
  'services/add_service',
  'self_create_service/set_name'
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

const showNavigationBar = template => {
  return hideNavBarTemplates.indexOf(template) === -1
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
  let user = req.user
  let account = req.account
  let convertedData = _.clone(data)
  convertedData.permissions = getPermissions(user, req.service)
  convertedData.navigation = showNavigationBar(template)
  addGatewayAccountProviderDisplayNames(convertedData)
  convertedData.currentGatewayAccount = getAccount(account)
  return convertedData
}
