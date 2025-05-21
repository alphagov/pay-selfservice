const _ = require('lodash')
const url = require('url')
const getHeldPermissions = require('./get-held-permissions')
const { serviceNavigationItems, adminNavigationItems } = require('./nav-builder')
const formatPSPname = require('./format-PSP-name')
const serviceNavigation = require('./simplified-account/navigation/service-navigation')
const serviceSettingsNavigation = require('./simplified-account/navigation/service-settings-navigation')
const GatewayAccount = require('@models/GatewayAccount.class')
const { getActiveCredential } = require('@utils/credentials')

const hideServiceHeaderTemplates = [
  'services/add-service',
  'payouts/list',
  'feedback/index',
  'error',
  'error-with-link',
  '404',
  'policy/document/contract-for-non-crown-bodies',
  'policy/document/memorandum-of-understanding-for-crown-bodies',
  'policy/document/pci-dss-attestation-of-compliance',
  'policy/document/stripe-connected-account-agreement',
  'policy/document/v2/contract-for-non-crown-bodies',
  'policy/document/v2/memorandum-of-understanding-for-crown-bodies',
  'policy/document/v2/stripe-connected-account-agreement',
  'policy/stripe-terms-and-conditions/stripe-terms-and-conditions',
]

const hideServiceNavTemplates = [
  'services/edit-service-name',
  'services/add-service',
  'services/select-org-type',
  'user/my-profile',
  'user/edit-phone-number',
  'request-to-go-live/agreement',
  'request-to-go-live/choose-how-to-process-payments',
  'request-to-go-live/index',
  'request-to-go-live/organisation-address',
  'request-to-go-live/organisation-name',
  'request-psp-test-account/index',
  'two-factor-auth/index',
  'two-factor-auth/phone-number',
  'two-factor-auth/configure',
  'two-factor-auth/resend-sms-code',
]

const digitalWalletsSupportedProviders = ['sandbox', 'stripe', 'worldpay']

/**
 * converts users permission array of form
 * [
 * 'permission-type:operation',
 * ...
 * ]
 * to object of form
 * {
 *   'permission_type_operation': true,
 *   ...
 * }
 * @param user
 * @param service
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

const hideServiceHeader = (template) => {
  return hideServiceHeaderTemplates.indexOf(template) !== -1
}

const hideServiceNav = (template) => {
  return hideServiceNavTemplates.indexOf(template) !== -1
}

const addGatewayAccountProviderDisplayNames = (data) => {
  const gatewayAccounts = _.get(data, 'gatewayAccounts', null)
  if (gatewayAccounts) {
    const convertedGateWayAccounts = gatewayAccounts.map((gatewayAccount) => {
      if (gatewayAccount.payment_provider) {
        gatewayAccount.payment_provider_display_name = _.startCase(gatewayAccount.payment_provider)
      }
      return gatewayAccount
    })
    data.gatewayAccounts = convertedGateWayAccounts
  }
}

const getAccount = (account) => {
  if (account) {
    account.full_type =
      account.type === 'test' ? [formatPSPname(account.payment_provider), account.type].join(' ') : account.type
  }
  return account
}

const informationNeeded = (account) => {
  if (account) {
    if (account instanceof GatewayAccount) {
      return account.getActiveCredential() === null
    } else {
      // TODO: bin me, back compat code
      return getActiveCredential(account) === null
    }
  }
  return false
}

module.exports = function (req, data, template) {
  const convertedData = _.clone(data)
  const { user, account, service, session, url: relativeUrl } = req
  const permissions = getPermissions(user, service)
  const isAdminUser = service && user && user.isAdminUserForService(service.externalId)
  const paymentMethod = _.get(account, 'paymentMethod', 'card')
  const paymentProvider = account && (account.payment_provider || account.paymentProvider) // TODO back compat, remove me
  convertedData.loggedIn = user && session && user.sessionVersion === session.version
  convertedData.paymentMethod = paymentMethod
  convertedData.permissions = permissions
  convertedData.isAdminUser = isAdminUser
  convertedData.hideServiceHeader = hideServiceHeader(template)
  convertedData.hideServiceNav = hideServiceNav(template)
  convertedData.hideFeedbackBanner = template === 'feedback/index'
  addGatewayAccountProviderDisplayNames(convertedData)
  convertedData.currentGatewayAccount = getAccount(account)
  convertedData.isTestGateway = _.get(convertedData, 'currentGatewayAccount.type') === 'test'
  convertedData.isSandbox = paymentProvider === 'sandbox'
  convertedData.isDigitalWalletSupported = digitalWalletsSupportedProviders.includes(paymentProvider)
  convertedData.currentService = service
  convertedData.isLive = req.isLive
  convertedData.humanReadableEnvironment = convertedData.isLive ? 'Live' : 'Test'
  convertedData.informationNeeded = informationNeeded(account)
  // TODO update this as url.parse is deprecated
  const currentPath = (relativeUrl && url.parse(relativeUrl).pathname.replace(/([a-z])\/$/g, '$1')) || '' // remove query params and trailing slash
  const currentUrl = req.baseUrl && req.path ? req.baseUrl + req.path : 'unavailable'
  if (permissions) {
    convertedData.serviceNavigationItems = serviceNavigationItems(
      currentPath,
      permissions,
      paymentMethod,
      currentUrl,
      service,
      account
    )
    convertedData.adminNavigationItems = adminNavigationItems(
      currentPath,
      permissions,
      paymentMethod,
      paymentProvider,
      account
    )
    // TODO PP-14060
    // convertedData.serviceNavigation = serviceNavigation(account, service, currentUrl, permissions)
    if (currentUrl.match(/service\/[A-z0-9]+\/account\/test|live\/settings/)) {
      convertedData.serviceSettings = serviceSettingsNavigation(account, service, currentUrl, permissions)
    }
  }
  convertedData._features = {}
  if (req.user && req.user.features) {
    req.user.features.forEach((feature) => {
      convertedData._features[feature.trim()] = true
    })
  }

  return convertedData
}
