const { response } = require('@utils/response')
const serviceService = require('@services/service.service')
const { paths } = require('@root/routes')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const formatAccountPathsFor = require('@utils/format-account-paths-for')
const getHeldPermissions = require('@utils/get-held-permissions')
const logger = require('@utils/logger')(__filename)
const { STRIPE, SANDBOX, WORLDPAY } = require('@models/constants/payment-providers')

async function get (req, res) {
  const userServiceRoles = req.user.serviceRoles
  const flags = {}

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

  return response(req, res, 'simplified-account/services/index', {
    createServiceLink: paths.services.create.index,
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
        if (account.type === 'live') return true
        // PP-13525 return exactly one test account. PSP preference: Stripe -> Sandbox -> Worldpay
        if (account.type === 'test') {
          const testAccounts = accounts.filter(acc => acc.type === 'test')
          if (testAccounts.length === 0) return false
          if (testAccounts.length === 1) return true // there is only one test account so keep it

          for (const provider of [STRIPE, SANDBOX, WORLDPAY]) {
            const testAccountsByProvider = testAccounts.filter(testAccount => testAccount.paymentProvider === provider)
            if (testAccountsByProvider.length > 1) {
              logger.debug(`Multiple ${provider} test accounts found for service [external_id: ${service.externalId}]`)
              // if for some reason there is more than one test account with the same provider, use the ID to work out the newest one
              testAccountsByProvider.sort((a, b) => parseInt(b.id) - parseInt(a.id))
              return account.id === testAccountsByProvider[0].id
            }
          }
          return false
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
          links: {
            dashboardLink: formatAccountPathsFor(paths.account.dashboard.index, account.externalId),
            editServiceNameLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, service.externalId, account.type),
            manageTeamMembersLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.teamMembers.index, service.externalId, account.type),
            organisationDetailsLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.index, service.externalId, account.type)
          }
        }
      })
      .sort((a, b) => {
        // ensure live gateway is first in array
        if (a.type === 'live') return -1
        return b.type === 'live' ? 1 : 0
      })

    return {
      externalId: service.externalId,
      name: service.serviceName.en,
      goLiveStage: service.currentGoLiveStage,
      currentPspTestAccountStage: service.currentPspTestAccountStage,
      createdDate: service.createdDate,
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

module.exports = {
  get
}
