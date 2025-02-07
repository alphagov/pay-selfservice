'use strict'

const process = require('process')
const _ = require('lodash')
const paths = require('./../paths')
const formatAccountPathsFor = require('./format-account-paths-for')
const formatSimplifiedAccountPathsFor = require('./simplified-account/format/format-simplified-account-paths-for')
const formatFutureStrategyAccountPathsFor = require('./format-future-strategy-account-paths-for')
const pathLookup = require('./path-lookup')
const formatPSPname = require('./format-PSP-name')
const { getPSPPageLinks } = require('./credentials')
const CREDENTIAL_STATE = require('@models/credential-state')
const flattenNestedValues = require('./flatten-nested-values')

const mainSettingsPaths = [
  paths.account.settings,
  paths.account.digitalWallet,
  paths.account.toggleBillingAddress,
  paths.account.emailNotifications,
  paths.account.toggleMotoMaskCardNumberAndSecurityCode,
  paths.account.defaultBillingAddressCountry
]

const yourPspPaths = ['your-psp', 'notification-credentials']
const additionalPspPaths = ['switch-psp']
const webhookPaths = ['webhooks']

const serviceNavigationItems = (currentPath, permissions, type, isDegatewayed, currentUrl, service = {}, account = {}) => {
  const gatewayAccountExternalId = account.external_id ?? account.externalId
  const serviceExternalId = account.service_id ?? service.externalId
  const navigationItems = []
  navigationItems.push({
    id: 'navigation-menu-home',
    name: 'Dashboard',
    url: formatAccountPathsFor(paths.account.dashboard.index, gatewayAccountExternalId),
    current: pathLookup(currentPath, paths.account.dashboard.index),
    permissions: true
  })
  if (type === 'card') {
    navigationItems.push({
      id: 'navigation-menu-transactions',
      name: 'Transactions',
      url: formatAccountPathsFor(paths.account.transactions.index, gatewayAccountExternalId),
      current: pathLookup(currentPath, paths.account.transactions.index),
      permissions: permissions.transactions_read
    })
  }
  navigationItems.push({
    id: 'navigation-menu-agreements',
    name: 'Agreements',
    url: formatFutureStrategyAccountPathsFor(paths.futureAccountStrategy.agreements.index, account.type, serviceExternalId, gatewayAccountExternalId),
    current: pathLookup(currentPath, paths.futureAccountStrategy.agreements.index),
    permissions: permissions.agreements_read && account.recurring_enabled
  })
  if (type === 'card') {
    navigationItems.push({
      id: 'navigation-menu-payment-links',
      name: 'Payment links',
      url: (permissions.token_create && formatAccountPathsFor(paths.account.paymentLinks.start, gatewayAccountExternalId)) ||
        formatAccountPathsFor(paths.account.paymentLinks.manage.index, gatewayAccountExternalId),
      current: currentPath !== '/' && flattenNestedValues(paths.account.paymentLinks).filter(path => currentPath.includes(path)).length,
      permissions: permissions.transactions_read
    })
  }
  navigationItems.push({
    id: 'navigation-menu-settings',
    name: 'Settings',
    url: formatAccountPathsFor(paths.account.settings.index, gatewayAccountExternalId),
    current: currentPath !== '/' && !currentUrl.includes('simplified')
      ? yourPspPaths.concat(additionalPspPaths, webhookPaths).filter(path => currentPath.includes(path)).length || pathLookup(currentPath, [
        ...mainSettingsPaths,
        paths.account.apiKeys,
        paths.futureAccountStrategy.webhooks,
        paths.account.paymentTypes
      ])
      : false,
    permissions: _.some([
      permissions.tokens_read,
      permissions.gateway_credentials_read,
      permissions.payment_types_read,
      permissions.toggle_3ds_read,
      permissions.email_notification_template_read
    ], Boolean)
  })
  if (isDegatewayed) {
    navigationItems.push({
      id: 'simplified-account-settings',
      name: 'Simplified Account Settings',
      url: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.index, serviceExternalId, account.type),
      current: currentUrl.includes('simplified') && currentUrl.includes('settings'),
      permissions: true
    })
  }

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
      permissions: permissions.tokens_update && !account.disabled
    },
    {
      id: 'navigation-menu-webhooks',
      name: 'Webhooks',
      url: formatFutureStrategyAccountPathsFor(paths.futureAccountStrategy.webhooks.index, account.type, account.service_id, account.external_id),
      current: pathLookup(currentPath, paths.futureAccountStrategy.webhooks.index),
      permissions: permissions.webhooks_update
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
    const navName = getPSPNavigationName(credential)
    return {
      id: (credential.state === CREDENTIAL_STATE.ACTIVE) || isSingleCredential ? 'navigation-menu-your-psp' : `navigation-menu-your-psp-${credential.external_id}`,
      name: navName,
      url: formatAccountPathsFor(paths.account.yourPsp.index, account.external_id, credential.external_id),
      current: currentPath.includes(credential.external_id)
    }
  })
}

function getPSPNavigationName (credential) {
  if (credential.state === CREDENTIAL_STATE.RETIRED) {
    return `Old PSP - ${formatPSPname(credential.payment_provider)}`
  } else if ((process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST === 'true') && (credential.payment_provider === 'stripe')) {
    return 'Information for Stripe'
  } else {
    return `Your PSP - ${formatPSPname(credential.payment_provider)}`
  }
}

module.exports = {
  serviceNavigationItems,
  adminNavigationItems,
  yourPSPNavigationItems
}
