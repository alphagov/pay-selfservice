const { response } = require('@utils/response')
const paths = require('@root/paths')
const { STRIPE, SANDBOX, WORLDPAY } = require('@models/constants/payment-providers')
const getHeldPermissions = require('@utils/get-held-permissions')
const logger = require('@utils/logger')(__filename)
const { getGatewayAccountsByIds } = require('@services/gateway-accounts.service')
const { DEFAULT_SERVICE_NAME } = require('@utils/constants')
const { formattedPathFor } = require('@root/paths')
const {
  accountLinksGenerator,
  sortByLiveThenName,
  isWorldpayTestService,
} = require('@utils/simplified-account/services/my-services/service-presentation-utils')

const SUPPORTED_ACCOUNT_PROVIDERS = [STRIPE, SANDBOX, WORLDPAY]

async function get(req, res) {
  const userServiceRoles = req.user.serviceRoles
  const flags = {}

  if (res.locals?.flash?.inviteSuccessServiceId?.[0]) {
    flags.recentlyInvitedServiceExternalId = res.locals.flash.inviteSuccessServiceId[0]
  }

  const gatewayAccountIds = userServiceRoles.flatMap((role) => {
    if (role?.service?.gatewayAccountIds && Array.isArray(role.service.gatewayAccountIds)) {
      return role.service.gatewayAccountIds
    }
    return []
  })

  let services = []
  if (gatewayAccountIds.length > 0) {
    const gatewayAccounts = await getGatewayAccountsByIds(gatewayAccountIds)
    services = mergeServicesWithGatewayAccounts(userServiceRoles, gatewayAccounts, flags).sort((a, b) =>
      sortByLiveThenName(a, b)
    )
  }

  const pathFilter = flags.hasLiveAccount ? 'live' : 'test'

  return response(req, res, 'simplified-account/services/my-services/index', {
    createServicePath: paths.services.create.index,
    allServiceTransactionsPath: formattedPathFor(paths.allServiceTransactions.indexStatusFilter, pathFilter),
    payoutsPath: formattedPathFor(paths.payouts.listStatusFilter, pathFilter),
    services,
    flags,
  })
}

const mergeServicesWithGatewayAccounts = (services, gatewayAccounts, flags) => {
  return services.map((serviceRole) => {
    const { service, role } = serviceRole

    if (flags.recentlyInvitedServiceExternalId === service.externalId) {
      flags.recentlyInvitedServiceName = service.name
    }

    const mappedGatewayAccounts = service.gatewayAccountIds
      .map((id) => gatewayAccounts[id])
      .filter((account) => account !== undefined)

    const mappedLiveGatewayAccounts = mappedGatewayAccounts.filter((account) => account.type === 'live')

    let mappedTestGatewayAccounts = mappedGatewayAccounts
      .filter((account) => account.type === 'test')
      .filter((account) => !account.disabled) // remove disabled test gateways

    mappedTestGatewayAccounts = filterTestGatewaysDegatewayView(mappedTestGatewayAccounts, service)

    if (mappedLiveGatewayAccounts.length > 0) {
      flags.hasLiveAccount = true
    }

    const associatedGatewayAccounts = [...mappedLiveGatewayAccounts, ...mappedTestGatewayAccounts]
      .map((account) => {
        if (account.paymentProvider === STRIPE) {
          flags.hasAccountWithPayouts = true
        }
        return {
          id: account.id,
          externalId: account.externalId,
          type: account.type,
          paymentProvider: account.paymentProvider,
          allowMoto: account.allowMoto,
          providerSwitchEnabled: account.providerSwitchEnabled,
          recurringEnabled: account.recurringEnabled,
          links: accountLinksGenerator(account, service),
        }
      })
      .sort((a, b) => {
        // ensure live gateway is first in array
        if (a.type === 'live') return -1
        return b.type === 'live' ? 1 : 0
      })

    const serviceName = service.serviceName.en || service.name

    return {
      externalId: service.externalId,
      name: serviceName === DEFAULT_SERVICE_NAME ? 'Temporary Service Name' : serviceName,
      goLiveStage: service.currentGoLiveStage,
      currentPspTestAccountStage: service.currentPspTestAccountStage,
      createdDate: service.createdDate,
      isWorldpayTestService: isWorldpayTestService(associatedGatewayAccounts),
      userIsAdminForService: role.name === 'admin',
      permissions: getHeldPermissions(role.permissions.map((permission) => permission.name)),
      gatewayAccounts: associatedGatewayAccounts,
    }
  })
}

// PP-13525 return exactly one test account. PSP preference: Stripe -> Sandbox -> Worldpay
const filterTestGatewaysDegatewayView = (testGatewayAccounts, service) => {
  return testGatewayAccounts.filter((account, _, accounts) => {
    if (accounts.length === 0) {
      logger.warn(`Service has no associated test gateway [service_external_id: ${service.externalId}]`)
      return false
    }
    if (accounts.length === 1) {
      if (SUPPORTED_ACCOUNT_PROVIDERS.includes(accounts[0].paymentProvider)) return true
      logger.warn(
        `Resolved test account is not of supported type [service_external_id: ${service.externalId}, payment_provider: ${accounts[0].paymentProvider}]`
      )
      return false
    }
    for (const provider of SUPPORTED_ACCOUNT_PROVIDERS) {
      const accountsByProvider = accounts.filter((testAccount) => testAccount.paymentProvider === provider)
      if (accountsByProvider.length > 0) {
        if (accountsByProvider.length > 1) {
          logger.warn(
            `Multiple ${provider} test accounts found for service [service_external_id: ${service.externalId}]`
          )
          // if for some reason there is more than one test account with the same provider, use the ID to work out the newest one
          accountsByProvider.sort((a, b) => parseInt(b.id) - parseInt(a.id))
        }
        return account.id === accountsByProvider[0].id
      }
    }
    return false
  })
}

module.exports = {
  get,
}
