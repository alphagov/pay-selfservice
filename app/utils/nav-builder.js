'use strict'

const process = require('process')
const _ = require('lodash')
const paths = require('./../paths')
const formatAccountPathsFor = require('./format-account-paths-for')
const formatFutureStrategyAccountPathsFor = require('./format-future-strategy-account-paths-for')
const pathLookup = require('./path-lookup')
const formatPSPname = require('./format-PSP-name')
const { getPSPPageLinks, CREDENTIAL_STATE } = require('./credentials')
const flattenNestedValues = require('./flatten-nested-values')

const mainSettingsPaths = [
  paths.account.settings,
  paths.account.digitalWallet,
  paths.account.toggle3ds,
  paths.account.toggleBillingAddress,
  paths.account.emailNotifications,
  paths.account.toggleMotoMaskCardNumberAndSecurityCode,
  paths.account.defaultBillingAddressCountry
]

const yourPspPaths = ['your-psp', 'notification-credentials']
const additionalPspPaths = ['switch-psp', 'kyc']
const webhookPaths =['webhooks']

const serviceNavigationItems = (currentPath, permissions, type, account = {}) => {
  const navigationItems = []
  navigationItems.push({
    id: 'navigation-menu-home',
    name: 'Dashboard',
    url: formatAccountPathsFor(paths.account.dashboard.index, account.external_id),
    current: pathLookup(currentPath, paths.account.dashboard.index),
    permissions: true
  })
  if (type === 'card') {
    navigationItems.push({
      id: 'navigation-menu-transactions',
      name: 'Transactions',
      url: formatAccountPathsFor(paths.account.transactions.index, account.external_id),
      current: pathLookup(currentPath, paths.account.transactions.index),
      permissions: permissions.transactions_read
    })
    navigationItems.push({
      id: 'navigation-menu-payment-links',
      name: 'Payment links',
      url: (permissions.token_create && formatAccountPathsFor(paths.account.paymentLinks.start, account.external_id)) ||
        formatAccountPathsFor(paths.account.paymentLinks.manage.index, account.external_id),
      current: currentPath !== '/' && flattenNestedValues(paths.account.paymentLinks).filter(path => currentPath.includes(path)).length,
      permissions: permissions.transactions_read
    })
  }
  navigationItems.push({
    id: 'navigation-menu-settings',
    name: 'Settings',
    url: formatAccountPathsFor(paths.account.settings.index, account.external_id),
    current: currentPath !== '/' ? yourPspPaths.concat(additionalPspPaths, webhookPaths).filter(path => currentPath.includes(path)).length || pathLookup(currentPath, [
      ...mainSettingsPaths,
      paths.account.apiKeys,
      paths.futureAccountStrategy.webhooks,
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
      id: 'navigation-menu-webhooks',
      name: 'Webhooks',
      url: formatFutureStrategyAccountPathsFor(paths.futureAccountStrategy.webhooks.index, account.type, account.service_id, account.external_id),
      current: pathLookup(currentPath, paths.futureAccountStrategy.webhooks.index),
      permissions: permissions.webhooks_update && process.env.FEATURE_ENABLE_WEBHOOKS === 'true'
    },
    ...yourPSPNavigationItems(account, currentPath).map((yourPSPNavigationItem) => ({
      ...yourPSPNavigationItem,
      permissions: permissions.gateway_credentials_update
    })),
    {
      id: 'navigation-menu-switch-psp',
      name: 'Switch PSP',
      url: formatAccountPathsFor(paths.account.switchPSP.index, account.external_id),
      current: pathLookup(currentPath, paths.account.switchPSP.index),
      permissions: permissions.gateway_credentials_update && account.provider_switch_enabled
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

function yourPSPNavigationItems (account, currentPath = '') {
  const credentialsToLink = getPSPPageLinks(account)
  const isSingleCredential = credentialsToLink.length === 1
  return credentialsToLink.map((credential) => {
    const prefix = credential.state === CREDENTIAL_STATE.RETIRED ? 'Old PSP' : 'Your PSP'
    return {
      id: (credential.state === CREDENTIAL_STATE.ACTIVE) || isSingleCredential ? 'navigation-menu-your-psp' : `navigation-menu-your-psp-${credential.external_id}`,
      name: `${prefix} - ${formatPSPname(credential.payment_provider)}`,
      url: formatAccountPathsFor(paths.account.yourPsp.index, account.external_id, credential.external_id),
      current: currentPath.includes(credential.external_id)
    }
  })
}

module.exports = {
  serviceNavigationItems: serviceNavigationItems,
  adminNavigationItems: adminNavigationItems,
  yourPSPNavigationItems
}
