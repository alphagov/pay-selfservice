'use strict'

const _ = require('lodash')
const paths = require('./../paths')
const pathLookup = require('./pathLookup')

const serviceNavigationItems = (originalUrl, permissions, type) => {
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
    url: paths.settings.index,
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

const adminNavigationItems = (originalUrl, permissions, type, paymentProvider) => {
  return [
    {
      id: 'navigation-menu-settings',
      name: 'Settings',
      url: paths.settings.index,
      current: pathLookup(originalUrl, paths.settings.index),
      permissions: type === 'card'
    },
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
      permissions: permissions.gateway_credentials_update && type === 'card' && (paymentProvider !== 'stripe')
    },
    {
      id: 'navigation-menu-payment-types',
      name: 'Card types',
      url: paths.paymentTypes.index,
      current: pathLookup(originalUrl, paths.paymentTypes.index) || pathLookup(originalUrl, paths.digitalWallet.summary),
      permissions: permissions.payment_types_read && type === 'card'
    },
    {
      id: 'navigation-menu-link-gocardless-app',
      name: 'Link GoCardless Merchant Account',
      url: paths.partnerApp.linkAccount,
      current: pathLookup(originalUrl, paths.partnerApp.linkAccount),
      permissions: permissions.connected_gocardless_account_update && type === 'direct debit'
    }
  ]
}

module.exports = {
  serviceNavigationItems: serviceNavigationItems,
  adminNavigationItems: adminNavigationItems
}
