let _ = require('lodash')
const paths = require('./../paths')
const pathLookup = require('./pathLookup')

const serviceNavigationItems = (originalUrl, permissions) => {
  var settingsPath
  // Settings doesn't exist as a page so need to link to the first available setting
  if (permissions.tokens_read) {
    settingsPath = paths.devTokens.index
  } else if (permissions.gateway_credentials_read) {
    settingsPath = paths.credentials.index
  } else if (permissions.payment_types_read) {
    settingsPath = paths.paymentTypes.summary
  } else if (permissions.toggle_3ds_read) {
    settingsPath = paths.toggle3ds.index
  } else if (permissions.email_notification_template_read) {
    settingsPath = paths.emailNotifications.index
  }

  return [
    {
      id: 'navigation-menu-home',
      name: 'Dashboard',
      url: paths.user.loggedIn,
      current: originalUrl === paths.user.loggedIn,
      permissions: true
    },
    {
      id: 'navigation-menu-transactions',
      name: 'Transactions',
      url: paths.transactions.index,
      current: pathLookup(originalUrl, paths.transactions.index),
      permissions: permissions.transactions_read
    },
    {
      id: 'navigation-menu-settings',
      name: 'Settings',
      url: settingsPath,
      current: pathLookup(originalUrl, [
        paths.credentials,
        paths.notificationCredentials,
        paths.toggle3ds,
        paths.devTokens,
        paths.emailNotifications,
        paths.paymentTypes
      ]),
      permissions: _.some([
        permissions.tokens_read,
        permissions.gateway_credentials_read,
        permissions.payment_types_read,
        permissions.toggle_3ds_read,
        permissions.email_notification_template_read
      ], Boolean)
    }
  ]
}

const adminNavigationItems = (originalUrl, permissions) => {
  return [
    {
      id: 'navigation-menu-api-keys',
      name: 'API keys',
      url: paths.devTokens.index,
      current: pathLookup(originalUrl, paths.devTokens.index),
      permissions: permissions.tokens_read
    },
    {
      id: 'navigation-menu-gateway-credentials',
      name: 'Account credentials',
      url: paths.credentials.index,
      current: pathLookup(originalUrl, paths.credentials.index),
      permissions: permissions.gateway_credentials_read
    },
    {
      id: 'navigation-menu-payment-types',
      name: 'Payment types',
      url: paths.paymentTypes.summary,
      current: pathLookup(originalUrl, paths.paymentTypes.summary),
      permissions: permissions.payment_types_read
    },
    {
      id: 'navigation-menu-3d-secure',
      name: '3D Secure',
      url: paths.toggle3ds.index,
      current: pathLookup(originalUrl, paths.toggle3ds.index),
      permissions: permissions.toggle_3ds_read
    },
    {
      id: 'navigation-menu-email-notifications',
      name: 'Email notifications',
      url: paths.emailNotifications.index,
      current: pathLookup(originalUrl, paths.emailNotifications.index),
      permissions: permissions.email_notification_template_read
    }
  ]
}

module.exports = {
  serviceNavigationItems: serviceNavigationItems,
  adminNavigationItems: adminNavigationItems
}
