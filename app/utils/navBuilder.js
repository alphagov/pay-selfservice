const _ = require('lodash')
const paths = require('./../paths')
const pathLookup = require('./pathLookup')

const serviceNavigationItems = (originalUrl, permissions, type) => {
  var settingsPath
  // Settings doesn't exist as a page so need to link to the first available setting
  if (permissions.tokens_read) {
    settingsPath = paths.apiKeys.index
  } else if (permissions.gateway_credentials_read && type === 'card') {
    settingsPath = paths.credentials.index
  } else if (permissions.toggle_3ds_read && type === 'card') {
    settingsPath = paths.toggle3ds.index
  } else if (permissions.payment_types_read && type === 'card') {
    settingsPath = paths.paymentTypes.summary
  } else if (permissions.email_notification_template_read) {
    settingsPath = paths.emailNotifications.index
  }

  const navigationItems = []
  navigationItems.push({
    id: 'navigation-menu-home',
    name: 'Dashboard',
    url: paths.dashboard.index,
    current: originalUrl === paths.dashboard.index,
    permissions: true
  })
  if (type === 'card') {
    navigationItems.push({
      id: 'navigation-menu-transactions',
      name: 'Transactions',
      url: paths.transactions.index,
      current: pathLookup(originalUrl, paths.transactions.index),
      permissions: permissions.transactions_read
    })
  }
  navigationItems.push({
    id: 'navigation-menu-settings',
    name: 'Settings',
    url: settingsPath,
    current: pathLookup(originalUrl, [
      paths.credentials,
      paths.notificationCredentials,
      paths.toggle3ds,
      paths.apiKeys,
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
  })

  return navigationItems
}

const adminNavigationItems = (originalUrl, permissions, type) => {
  return [
    {
      id: 'navigation-menu-api-keys',
      name: 'API keys',
      url: paths.apiKeys.index,
      current: pathLookup(originalUrl, paths.apiKeys.index),
      permissions: permissions.tokens_update
    },
    {
      id: 'navigation-menu-gateway-credentials',
      name: 'Account credentials',
      url: paths.credentials.index,
      current: pathLookup(originalUrl, paths.credentials.index),
      permissions: permissions.gateway_credentials_update && type === 'card'
    },
    {
      id: 'navigation-menu-3d-secure',
      name: '3D Secure',
      url: paths.toggle3ds.index,
      current: pathLookup(originalUrl, paths.toggle3ds.index),
      permissions: permissions.toggle_3ds_read && type === 'card'
    },
    {
      id: 'navigation-menu-payment-types',
      name: 'Card types',
      url: paths.paymentTypes.summary,
      current: pathLookup(originalUrl, paths.paymentTypes.summary),
      permissions: permissions.payment_types_read && type === 'card'
    },
    {
      id: 'navigation-menu-email-notifications',
      name: 'Email notifications',
      url: paths.emailNotifications.index,
      current: pathLookup(originalUrl, paths.emailNotifications.index),
      permissions: permissions.email_notification_template_read && type === 'card'
    },
    {
      id: 'navigation-menu-link-gocardless-app',
      name: 'Link GoCardless Merchant Account',
      url: paths.partnerApp.linkAccount,
      current: pathLookup(originalUrl, paths.partnerApp.linkAccount),
      permissions: permissions.tokens_update && type === 'direct debit'
    }
  ]
}

module.exports = {
  serviceNavigationItems: serviceNavigationItems,
  adminNavigationItems: adminNavigationItems
}
