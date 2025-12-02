'use strict'

const process = require('process')
const paths = require('./../paths')
const formatAccountPathsFor = require('./format-account-paths-for')
const formatSimplifiedAccountPathsFor = require('./simplified-account/format/format-simplified-account-paths-for')
const pathLookup = require('./path-lookup')
const formatPSPname = require('./format-PSP-name')
const { getPSPPageLinks } = require('./credentials')
const CREDENTIAL_STATE = require('@models/constants/credential-state')
const flattenNestedValues = require('./flatten-nested-values')

import { Features } from '@root/config/experimental-features'

const mainSettingsPaths = [
  paths.account.settings,
  paths.account.digitalWallet,
  paths.account.toggleBillingAddress,
  paths.account.emailNotifications,
  paths.account.toggleMotoMaskCardNumberAndSecurityCode,
  paths.account.defaultBillingAddressCountry,
]

const serviceNavigationItems = (currentPath, permissions, type, currentUrl, service = {}, account = {}) => {
  const gatewayAccountExternalId = account.external_id ?? account.externalId
  const serviceExternalId = account.service_id ?? service.externalId
  const navigationItems = []
  navigationItems.push({
    id: 'navigation-menu-home',
    name: 'Dashboard',
    url: formatAccountPathsFor(paths.account.dashboard.index, gatewayAccountExternalId),
    current: pathLookup(currentPath, paths.account.dashboard.index),
    permissions: true,
  })
  if (type === 'card') {
    navigationItems.push({
      id: 'navigation-menu-transactions',
      name: 'Transactions',
      url: Features.isEnabled(Features.TRANSACTIONS)
        ? formatSimplifiedAccountPathsFor(paths.simplifiedAccount.transactions.index, serviceExternalId, account.type)
        : formatAccountPathsFor(paths.account.transactions.index, gatewayAccountExternalId),
      current: pathLookup(currentPath, paths.account.transactions.index),
      permissions: permissions.transactions_read,
    })
  }
  navigationItems.push({
    id: 'navigation-menu-agreements',
    name: 'Agreements',
    url: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.agreements.index, serviceExternalId, account.type),
    current: pathLookup(currentPath, paths.simplifiedAccount.agreements.index),
    permissions: permissions.agreements_read && (account.recurring_enabled ?? account.recurringEnabled),
  })
  if (type === 'card') {
    navigationItems.push({
      id: 'navigation-menu-payment-links',
      name: 'Payment links',
      url: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.paymentLinks.index, serviceExternalId, account.type),
      current:
        currentPath !== '/' &&
        flattenNestedValues(paths.account.paymentLinks)
          .concat(['payment-links'])
          .filter((path) => currentPath.includes(path)).length,
      permissions: permissions.transactions_read,
    })
  }
  navigationItems.push({
    id: 'navigation-menu-settings',
    name: 'Settings',
    url: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.index, serviceExternalId, account.type),
    current: currentUrl.includes('settings'),
    permissions: true,
  })
  return navigationItems
}

const adminNavigationItems = (currentPath, permissions, type, paymentProvider, account = {}) => {
  return [
    {
      id: 'navigation-menu-settings-home',
      name: 'Settings',
      url: formatAccountPathsFor(paths.account.settings.index, account.external_id),
      current: pathLookup(currentPath, mainSettingsPaths),
      permissions: type === 'card',
    },
    ...yourPSPNavigationItems(account, currentPath).map((yourPSPNavigationItem) => ({
      ...yourPSPNavigationItem,
      permissions: permissions.gateway_credentials_update,
    })),
    {
      id: 'navigation-menu-switch-psp',
      name: 'Switch PSP',
      url: formatAccountPathsFor(paths.account.switchPSP.index, account.external_id),
      current: pathLookup(currentPath, paths.account.switchPSP.index),
      permissions: permissions.gateway_credentials_update && account.provider_switch_enabled,
    },
    {
      id: 'navigation-menu-payment-types',
      name: 'Card types',
      url: formatAccountPathsFor(paths.account.paymentTypes.index, account.external_id),
      current: pathLookup(currentPath, paths.account.paymentTypes.index),
      permissions: permissions.payment_types_read && type === 'card',
    },
  ]
}

function yourPSPNavigationItems(account, currentPath = '') {
  const credentialsToLink = getPSPPageLinks(account)
  const isSingleCredential = credentialsToLink.length === 1
  return credentialsToLink.map((credential) => {
    const navName = getPSPNavigationName(credential)
    return {
      id:
        credential.state === CREDENTIAL_STATE.ACTIVE || isSingleCredential
          ? 'navigation-menu-your-psp'
          : `navigation-menu-your-psp-${credential.external_id}`,
      name: navName,
      url: formatAccountPathsFor(paths.account.yourPsp.index, account.external_id, credential.external_id),
      current: currentPath.includes(credential.external_id),
    }
  })
}

function getPSPNavigationName(credential) {
  if (credential.state === CREDENTIAL_STATE.RETIRED) {
    return `Old PSP - ${formatPSPname(credential.payment_provider)}`
  } else if (process.env.ENABLE_STRIPE_ONBOARDING_TASK_LIST === 'true' && credential.payment_provider === 'stripe') {
    return 'Information for Stripe'
  } else {
    return `Your PSP - ${formatPSPname(credential.payment_provider)}`
  }
}

module.exports = {
  serviceNavigationItems,
  adminNavigationItems,
  yourPSPNavigationItems,
}
