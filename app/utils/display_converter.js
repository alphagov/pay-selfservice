let _ = require('lodash')
const getHeldPermissions = require('./get_held_permissions')

const paths = require('./../paths')
const pathLookup = require('./pathLookup')

const showNavBarTemplates = [
  'token',
  'token_generate',
  'provider_credentials/sandbox',
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

const serviceNavigationItems = originalUrl => {
  return [
    {
      name: 'Dashboard',
      url: paths.user.loggedIn,
      current: pathLookup(originalUrl, paths.user.loggedIn),
      permissions: true
    },
    {
      name: 'Transactions',
      url: paths.transactions.index,
      current: pathLookup(originalUrl, paths.transactions.index),
      permissions: true
    },
    {
      name: 'Settings',
      url: paths.devTokens.index,
      current: pathLookup(originalUrl, [
        paths.credentials,
        paths.notificationCredentials,
        paths.serviceName,
        paths.toggle3ds,
        paths.devTokens,
        paths.emailNotifications,
        paths.paymentTypes
      ]),
      permissions: true
    }
  ]
}

const adminNavigationItems = (originalUrl, permissions) => {
  return [
    {
      name: 'API Keys',
      url: paths.devTokens.index,
      current: pathLookup(originalUrl, paths.devTokens.index),
      permissions: permissions.tokens_read
    },
    {
      name: 'Account credentials',
      url: paths.credentials.index,
      current: pathLookup(originalUrl, paths.credentials.index),
      permissions: permissions.gateway_credentials_read
    },
    {
      name: 'Change service name',
      url: paths.serviceName.index,
      current: pathLookup(originalUrl, paths.serviceName.index),
      permissions: permissions.service_name_read
    },
    {
      name: 'Payment types',
      url: paths.paymentTypes.summary,
      current: pathLookup(originalUrl, paths.paymentTypes.summary),
      permissions: permissions.payment_types_read
    },
    {
      name: '3D Secure',
      url: paths.toggle3ds.index,
      current: pathLookup(originalUrl, paths.toggle3ds.index),
      permissions: permissions.toggle_3ds_read
    },
    {
      name: 'Email notifications',
      url: paths.emailNotifications.index,
      current: pathLookup(originalUrl, paths.emailNotifications.index),
      permissions: permissions.email_notification_template_read
    }
  ]
}


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
  return showNavBarTemplates.indexOf(template) !== -1
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
  let originalUrl = req.originalUrl
  let serviceName = req.account.service_name
  let permissions = getPermissions(user, req.service)
  convertedData.serviceName = serviceName
  convertedData.permissions = permissions
  console.log(template)
  console.log(showNavigationBar(template))
  convertedData.navigation = showNavigationBar(template)
  convertedData.serviceNavigationItems = serviceNavigationItems(originalUrl)
  convertedData.adminNavigationItems = adminNavigationItems(originalUrl, permissions)
  addGatewayAccountProviderDisplayNames(convertedData)
  convertedData.currentGatewayAccount = getAccount(account)
  return convertedData
}
