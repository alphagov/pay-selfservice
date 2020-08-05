'use strict'

const _ = require('lodash')
const paths = require('./../paths')
const pathLookup = require('./path-lookup')
const formatPSPname = require('./format-PSP-name')

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
    navigationItems.push({
      id: 'navigation-menu-payment-links',
      name: 'Payment links',
      url: paths.paymentLinks.start,
      current: pathLookup(originalUrl, paths.paymentLinks.start),
      permissions: permissions.tokens_create
    })
  }
  navigationItems.push({
    id: 'navigation-menu-settings',
    name: 'Settings',
    url: type === 'card' ? paths.settings.index : paths.apiKeys.index,
    current: originalUrl !== '/' ? pathLookup(originalUrl.replace(/([a-z])\/$/g, '$1'), [
      paths.settings.index,
      paths.yourPsp,
      paths.notificationCredentials,
      paths.toggle3ds,
      paths.apiKeys,
      paths.emailNotifications,
      paths.paymentTypes
    ]) : false,
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
      id: 'navigation-menu-your-psp',
      name: `Your PSP - ${formatPSPname(paymentProvider)}`,
      url: paths.yourPsp.index,
      current: pathLookup(originalUrl, paths.yourPsp.index),
      permissions: permissions.gateway_credentials_update && type === 'card' && (paymentProvider !== 'stripe') && (paymentProvider !== 'sandbox')
    },
    {
      id: 'navigation-menu-payment-types',
      name: 'Card types',
      url: paths.paymentTypes.index,
      current: pathLookup(originalUrl, paths.paymentTypes.index) || pathLookup(originalUrl, paths.digitalWallet.summary),
      permissions: permissions.payment_types_read && type === 'card'
    }
  ]
}

module.exports = {
  serviceNavigationItems: serviceNavigationItems,
  adminNavigationItems: adminNavigationItems
}
