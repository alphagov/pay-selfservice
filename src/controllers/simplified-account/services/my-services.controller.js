const { response } = require('@utils/response')
const paths = require('@root/paths')
const { STRIPE, SANDBOX, WORLDPAY } = require('@models/constants/payment-providers')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const formatAccountPathsFor = require('@utils/format-account-paths-for')
const getHeldPermissions = require('@utils/get-held-permissions')
const logger = require('@utils/logger')(__filename)
const serviceService = require('@services/service.service')
const { DEFAULT_SERVICE_NAME } = require('@utils/constants')
const formatServicePathsFor = require('@utils/format-service-paths-for')
const { formattedPathFor } = require('@root/paths')

async function get (req, res) {
  const userServiceRoles = req.user.serviceRoles
  const flags = {
    userIsDegatewayed: req.user.isDegatewayed()
  }

  if (res.locals?.flash?.inviteSuccessServiceId?.[0]) {
    flags.recentlyInvitedServiceExternalId = res.locals?.flash?.inviteSuccessServiceId[0]
  }

  const gatewayAccountIds = userServiceRoles.flatMap(role => {
    if (role?.service?.gatewayAccountIds && Array.isArray(role.service.gatewayAccountIds)) {
      return role.service.gatewayAccountIds
    }
    return []
  })

  const gatewayAccounts = await serviceService.getGatewayAccountsByIds(gatewayAccountIds)
  const services = mergeServicesWithGatewayAccounts(userServiceRoles, gatewayAccounts, flags)
    .sort((a, b) => sortServicesByLiveThenName(a, b))

  const pathFilter = flags.hasLiveAccount ? 'live' : 'test'

  return response(req, res, 'simplified-account/services/my-services/index', {
    createServicePath: paths.services.create.index,
    allServiceTransactionsPath: formattedPathFor(paths.allServiceTransactions.indexStatusFilter, pathFilter),
    payoutsPath: formattedPathFor(paths.payouts.listStatusFilter, pathFilter),
    services,
    flags
  })
}

const mergeServicesWithGatewayAccounts = (services, gatewayAccounts, flags) => {
  return services.map(serviceRole => {
    const { service, role } = serviceRole

    if (flags.recentlyInvitedServiceExternalId === service.externalId) {
      flags.recentlyInvitedServiceName = service.name
    }

    const associatedGatewayAccounts = service.gatewayAccountIds
      .map(accountId => gatewayAccounts[accountId])
      .filter(account => account !== undefined)
      .filter((account, _, accounts) => {
        if (account.type === 'live') {
          flags.hasLiveAccount = true
          return true
        }
        // PP-13525 return exactly one test account. PSP preference: Stripe -> Sandbox -> Worldpay
        const testAccounts = accounts.filter(acc => acc.type === 'test')
        if (testAccounts.length === 0) {
          logger.warn(`Service has no associated test gateway [service_external_id: ${service.externalId}]`)
          return false
        }
        if (testAccounts.length === 1) {
          if ([STRIPE, SANDBOX, WORLDPAY].includes(testAccounts[0].paymentProvider)) return true
          logger.warn(`Resolved test account is not of supported type [service_external_id: ${service.externalId}, payment_provider: ${testAccounts[0].paymentProvider}]`)
          return false
        }
        for (const provider of [STRIPE, SANDBOX, WORLDPAY]) {
          const testAccountsByProvider = testAccounts.filter(testAccount => testAccount.paymentProvider === provider)
          if (testAccountsByProvider.length > 1) {
            logger.warn(`Multiple ${provider} test accounts found for service [external_id: ${service.externalId}]`)
            // if for some reason there is more than one test account with the same provider, use the ID to work out the newest one
            testAccountsByProvider.sort((a, b) => parseInt(b.id) - parseInt(a.id))
            return account.id === testAccountsByProvider[0].id
          }
        }
        return false
      })
      .map(account => {
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
          links: linksGenerator(account, service, flags)
        }
      })
      .sort((a, b) => {
        // ensure live gateway is first in array
        if (a.type === 'live') return -1
        return b.type === 'live' ? 1 : 0
      })

    return {
      externalId: service.externalId,
      name: service.serviceName.en === DEFAULT_SERVICE_NAME ? 'Temporary Service Name' : service.serviceName.en,
      goLiveStage: service.currentGoLiveStage,
      currentPspTestAccountStage: service.currentPspTestAccountStage,
      createdDate: service.createdDate,
      isWorldpayTestService: isWorldpayTestService(associatedGatewayAccounts),
      userIsAdminForService: role.name === 'admin',
      permissions: getHeldPermissions(role.permissions.map(permission => permission.name)),
      gatewayAccounts: associatedGatewayAccounts
    }
  })
}

const sortServicesByLiveThenName = (a, b) => {
  const aHasLive = a.gatewayAccounts.some(account => account.type === 'live')
  const bHasLive = b.gatewayAccounts.some(account => account.type === 'live')
  if (aHasLive !== bHasLive) return bHasLive ? 1 : -1
  return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
}

const isWorldpayTestService = (gatewayAccounts) => {
  return gatewayAccounts.length === 1 && gatewayAccounts[0].type === 'test' &&
    gatewayAccounts[0].paymentProvider === WORLDPAY
}

const linksGenerator = (account, service, flags) => {
  return {
    dashboardLink: formatAccountPathsFor(paths.account.dashboard.index, account.externalId),
    editServiceNameLink: flags.userIsDegatewayed
      ? formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, service.externalId, account.type)
      : formatServicePathsFor(paths.service.editServiceName.index, service.externalId),
    manageTeamMembersLink: flags.userIsDegatewayed
      ? formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, service.externalId, account.type)
      : formatServicePathsFor(paths.service.teamMembers.index, service.externalId),
    organisationDetailsLink: flags.userIsDegatewayed
      ? formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.index, service.externalId, account.type)
      : formatServicePathsFor(paths.service.organisationDetails.index, service.externalId)
  }
}

module.exports = {
  get
}
