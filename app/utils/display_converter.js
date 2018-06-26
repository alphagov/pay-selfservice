const _ = require('lodash')
const getHeldPermissions = require('./get_held_permissions')
const {serviceNavigationItems, adminNavigationItems} = require('./navBuilder')

const hideServiceHeaderTemplates = [
  'services/index',
  'services/edit_service_name',
  'services/add_service'
]

const hideServiceNavTemplates = [
  'merchant_details/edit_merchant_details',
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

const hideServiceHeader = template => {
  return hideServiceHeaderTemplates.indexOf(template) !== -1
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
  const convertedData = _.clone(data)
  const user = req.user
  const account = req.account
  const originalUrl = req.originalUrl
  const permissions = getPermissions(user, req.service)
  const paymentMethod = _.get(account, 'paymentMethod', 'card')
  convertedData.paymentMethod = paymentMethod
  convertedData.permissions = permissions
  convertedData.hideServiceHeader = hideServiceHeader(template)
  convertedData.hideServiceNav = hideServiceNav(template)
  convertedData.hideFeedbackBanner = template === 'feedback/index'
  addGatewayAccountProviderDisplayNames(convertedData)
  convertedData.currentGatewayAccount = getAccount(account)
  convertedData.isTestGateway = _.get(convertedData, 'currentGatewayAccount.type') === 'test'
  convertedData.isSandbox = _.get(convertedData, 'currentGatewayAccount.payment_provider') === 'sandbox'
  convertedData.currentService = _.get(req, 'service')
  if (permissions) {
    convertedData.serviceNavigationItems = serviceNavigationItems(originalUrl, permissions, paymentMethod)
    convertedData.adminNavigationItems = adminNavigationItems(originalUrl, permissions, paymentMethod)
  }
  convertedData._features = {}
  if (req.user && req.user.features) {
    req.user.features.forEach(feature => {
      convertedData._features[feature.trim()] = true
    })
  }

  return convertedData
}
