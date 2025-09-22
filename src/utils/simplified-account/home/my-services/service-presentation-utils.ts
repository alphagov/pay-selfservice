import GoLiveStage from '@models/constants/go-live-stage'
import PaymentProviders from '@models/constants/payment-providers'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import ServiceRole from '@models/service/ServiceRole.class'
import paths from '@root/paths'
import createLogger from '@utils/logger'
import { DEFAULT_SERVICE_NAME } from '@utils/constants'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import Service from '@models/service/Service.class'

const logger = createLogger(__filename)
const SUPPORTED_ACCOUNT_PROVIDERS = [PaymentProviders.STRIPE, PaymentProviders.SANDBOX, PaymentProviders.WORLDPAY]

export interface ViewFlags {
  recentlyInvitedServiceExternalId?: string
  recentlyInvitedServiceName?: string
  hasLiveAccount?: boolean
  hasAccountWithPayouts?: boolean
}

export interface MappedGateway {
  id: number
  externalId: string
  type: string
  paymentProvider: string
  allowMoto: boolean
  providerSwitchEnabled: boolean
  recurringEnabled: boolean
  disabled: boolean
}

export interface MergedServiceWithGateways {
  name: string
  status?: ServiceStatus
  createdDate: string
  gatewayAccounts: MappedGateway[]
  href: string
}

interface ServiceStatus {
  tag: {
    text: string
    colour: 'govuk-tag--grey' | 'govuk-tag--blue' | 'govuk-tag--red'
  }
}

const mapServiceStatus = (goLiveStage: string, serviceGateways: MappedGateway[]): ServiceStatus | undefined => {
  if (serviceGateways[0].disabled) {
    return {
      tag: {
        text: 'Not taking payments',
        colour: 'govuk-tag--red',
      },
    }
  }

  if (![GoLiveStage.LIVE, GoLiveStage.DENIED].includes(goLiveStage)) {
    if (isWorldpayTestService(serviceGateways)) {
      return {
        tag: {
          text: 'Worldpay test',
          colour: 'govuk-tag--grey',
        },
      }
    } else {
      return {
        tag: {
          text: 'Not live yet',
          colour: 'govuk-tag--blue',
        },
      }
    }
  }

  return undefined
}

const sortByLiveThenName = (a: MergedServiceWithGateways, b: MergedServiceWithGateways) => {
  const aHasLive = a.gatewayAccounts.some((account) => account.type === GatewayAccountType.LIVE)
  const bHasLive = b.gatewayAccounts.some((account) => account.type === GatewayAccountType.LIVE)
  if (aHasLive !== bHasLive) return bHasLive ? 1 : -1
  return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
}

const isWorldpayTestService = (gatewayAccounts: MappedGateway[]) => {
  return (
    gatewayAccounts.length === 1 &&
    gatewayAccounts[0].type === GatewayAccountType.TEST &&
    gatewayAccounts[0].paymentProvider === PaymentProviders.WORLDPAY
  )
}

const mergeServicesWithGatewayAccounts = (
  serviceRoles: ServiceRole[],
  gatewayAccounts: Record<number, GatewayAccount>,
  flags: ViewFlags
) => {
  return serviceRoles.map((serviceRole): MergedServiceWithGateways => {
    const { service } = serviceRole

    if (flags.recentlyInvitedServiceExternalId === service.externalId) {
      flags.recentlyInvitedServiceName = service.name
    }

    const mappedGatewayAccounts = service.gatewayAccountIds
      .map((id) => gatewayAccounts[parseInt(id)])
      .filter((account) => account !== undefined)

    const mappedLiveGatewayAccounts = mappedGatewayAccounts.filter(
      (account) => account.type === GatewayAccountType.LIVE
    )

    let mappedTestGatewayAccounts = mappedGatewayAccounts
      .filter((account) => account.type === GatewayAccountType.TEST)
      .filter((account) => !account.disabled) // remove disabled test gateways

    mappedTestGatewayAccounts = filterTestGateways(mappedTestGatewayAccounts, service)

    if (mappedLiveGatewayAccounts.length > 0) {
      flags.hasLiveAccount = true
    }

    const associatedGatewayAccounts = [...mappedLiveGatewayAccounts, ...mappedTestGatewayAccounts]
      .map((account): MappedGateway => {
        if (account.paymentProvider === PaymentProviders.STRIPE) {
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
          disabled: account.disabled,
        }
      })
      .sort((a, b) => {
        // ensure live gateway is first in array
        if (a.type === GatewayAccountType.LIVE) return -1
        return b.type === GatewayAccountType.LIVE ? 1 : 0
      })

    const serviceName = service.serviceName.en || service.name

    return {
      name: serviceName === DEFAULT_SERVICE_NAME ? 'Temporary Service Name' : serviceName,
      status: mapServiceStatus(service.currentGoLiveStage, associatedGatewayAccounts),
      createdDate: service.createdDate,
      gatewayAccounts: associatedGatewayAccounts,
      href: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.dashboard.index,
        service.externalId,
        associatedGatewayAccounts[0].type
      ),
    }
  })
}

// PP-13525 return exactly one test account. PSP preference: Stripe -> Sandbox -> Worldpay
const filterTestGateways = (testGatewayAccounts: GatewayAccount[], service: Service) => {
  return testGatewayAccounts.filter((account, _, accounts) => {
    if (accounts.length === 0) {
      logger.warn(`Service has no associated test gateway [service_external_id: ${service.externalId}]`)
      return false
    }
    if (accounts.length === 1) {
      if (SUPPORTED_ACCOUNT_PROVIDERS.includes(accounts[0].paymentProvider)) return true
      logger.warn(
        `Resolved test account is not a supported payment provider [service_external_id: ${service.externalId}, payment_provider: ${accounts[0].paymentProvider}]`
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
          accountsByProvider.sort((a, b) => b.id - a.id)
        }
        return account.id === accountsByProvider[0].id
      }
    }
    return false
  })
}

export { sortByLiveThenName, mergeServicesWithGatewayAccounts }
