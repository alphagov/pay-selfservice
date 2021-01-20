'use strict'

const _ = require('lodash')
const paths = require('./../paths')
const formatAccountPathsFor = require('./format-account-paths-for')
const pathLookup = require('./path-lookup')
const formatPSPname = require('./format-PSP-name')

const mainSettingsPaths = [
  paths.account.settings,
  paths.account.digitalWallet,
  paths.account.toggle3ds,
  paths.account.toggleBillingAddress,
  paths.account.emailNotifications,
  paths.account.toggleMotoMaskCardNumberAndSecurityCode
]

const yourPspPaths = [
  paths.account.yourPsp,
  paths.account.credentials,
  paths.account.notificationCredentials
]

const serviceNavigationItems = (currentPath, permissions, type, account = {}) => {
  const navigationItems = []
  navigationItems.push({
    id: 'navigation-menu-home',
    name: 'Dashboard',
    url: paths.dashboard.index,
    current: currentPath === paths.dashboard.index,
    permissions: true
  })
  if (type === 'card') {
    const paymentLinksStartUrl = formatAccountPathsFor(paths.account.paymentLinks.start, account.external_id)
    navigationItems.push({
      id: 'navigation-menu-transactions',
      name: 'Transactions',
      url: paths.transactions.index,
      current: pathLookup(currentPath, paths.transactions.index),
      permissions: permissions.transactions_read
    })
    navigationItems.push({
      id: 'navigation-menu-payment-links',
      name: 'Payment links',
      url: paymentLinksStartUrl,
      current: pathLookup(currentPath, paymentLinksStartUrl),
      permissions: permissions.tokens_create
    })
  }
  navigationItems.push({
    id: 'navigation-menu-settings',
    name: 'Settings',
    url: formatAccountPathsFor(paths.account.settings.index, account.external_id),
    current: currentPath !== '/' ? pathLookup(currentPath, [
      ...mainSettingsPaths,
      ...yourPspPaths,
      paths.account.apiKeys,
      paths.account.paymentTypes
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

const adminNavigationItems = (currentPath, permissions, type, paymentProvider, account = {}) => {
  const apiKeysPath = formatAccountPathsFor(paths.account.apiKeys.index, account.external_id)

  return [
    {
      id: 'navigation-menu-settings-home',
      name: 'Settings',
      url: formatAccountPathsFor(paths.account.settings.index, account.external_id),
      current: pathLookup(currentPath, mainSettingsPaths),
      permissions: type === 'card'
    },
    {
      id: 'navigation-menu-api-keys',
      name: 'API keys',
      url: apiKeysPath,
      current: pathLookup(currentPath, paths.account.apiKeys.index),
      permissions: permissions.tokens_update
    },
    {
      id: 'navigation-menu-your-psp',
      name: `Your PSP - ${formatPSPname(paymentProvider)}`,
      url: formatAccountPathsFor(paths.account.yourPsp.index, account.external_id),
      current: pathLookup(currentPath, yourPspPaths),
      permissions: permissions.gateway_credentials_update && type === 'card' && (paymentProvider !== 'stripe') && (paymentProvider !== 'sandbox')
    },
    {
      id: 'navigation-menu-payment-types',
      name: 'Card types',
      url: formatAccountPathsFor(paths.account.paymentTypes.index, account.external_id),
      current: pathLookup(currentPath, paths.account.paymentTypes.index),
      permissions: permissions.payment_types_read && type === 'card'
    }
  ]
}

module.exports = {
  serviceNavigationItems: serviceNavigationItems,
  adminNavigationItems: adminNavigationItems
}
