import Service from '@models/service/Service.class'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import GoLiveStage from '@models/constants/go-live-stage'
import PaymentProviders from '@models/constants/payment-providers'
import createLogger from '@utils/logger'
import { ServiceViewLinksGenerator } from '@models/service-view/ServiceViewLinksGenerator.class'

const logger = createLogger(__filename)

export const StatusTag: Record<string, StatusTag> = {
  LIVE: 'LIVE', // live account - service is live and able to take payments
  PSP_ONBOARDING: 'PSP_ONBOARDING', // live account - service is setting up their live account
  GO_LIVE_REQUESTED: 'GO_LIVE_REQUESTED', // test account - service only has a test account, but has requested a live account
  GO_LIVE_IN_PROGRESS: 'GO_LIVE_IN_PROGRESS', // test account - service only has a test account, but has requested a live account
  WORLDPAY_TEST: 'WORLDPAY_TEST', // test account - service is for a worldpay test account. cannot be made live
  TEST_ACCOUNT_ONLY: 'TEST_ACCOUNT_ONLY', // test account - service has not submitted a go live request
  SANDBOX_MODE: 'SANDBOX_MODE', // test account - service has a live account, live account may be in any state
  RESTRICTED: 'RESTRICTED', // test or live account - account is disabled
  UNKNOWN: 'UNKNOWN', // test or live account - unknown service state, should not occur
}

export type StatusTag =
  | 'LIVE'
  | 'PSP_ONBOARDING'
  | 'STRIPE_PSP_ONBOARDING_COMPLETE'
  | 'GO_LIVE_REQUESTED'
  | 'GO_LIVE_IN_PROGRESS'
  | 'WORLDPAY_TEST'
  | 'TEST_ACCOUNT_ONLY'
  | 'SANDBOX_MODE'
  | 'RESTRICTED'
  | 'UNKNOWN'

const DisplayTag: Record<string, DisplayTag> = {
  NONE: 'NONE',
  LIVE: 'LIVE',
  NOT_LIVE_YET: 'NOT_LIVE_YET',
  WORLDPAY_TEST: 'WORLDPAY_TEST',
  SANDBOX_MODE: 'SANDBOX_MODE',
  NOT_TAKING_PAYMENTS: 'NOT_TAKING_PAYMENTS',
}

type DisplayTag = 'NONE' | 'LIVE' | 'NOT_LIVE_YET' | 'WORLDPAY_TEST' | 'SANDBOX_MODE' | 'NOT_TAKING_PAYMENTS'

export class ServiceView {
  statusTag: StatusTag
  displayTag: DisplayTag

  showHeader: boolean

  private readonly service: Service
  private readonly accountType: string

  private readonly links: ServiceViewLinksGenerator

  constructor(statusTag: StatusTag, displayTag: DisplayTag, service: Service, accountType: string) {
    this.statusTag = statusTag
    this.displayTag = displayTag
    this.service = service
    this.accountType = accountType

    // at present not all routes currently include the service header
    this.showHeader = false
    this.links = new ServiceViewLinksGenerator(service.externalId, accountType)
  }

  static Live(service: Service) {
    return new ServiceView(StatusTag.LIVE, DisplayTag.LIVE, service, GatewayAccountType.LIVE)
  }

  static GoLiveRequested(service: Service) {
    return new ServiceView(StatusTag.GO_LIVE_REQUESTED, DisplayTag.NOT_LIVE_YET, service, GatewayAccountType.TEST)
  }

  static GoLiveInProgress(service: Service) {
    return new ServiceView(StatusTag.GO_LIVE_IN_PROGRESS, DisplayTag.NOT_LIVE_YET, service, GatewayAccountType.TEST)
  }

  static WorldpayTest(service: Service) {
    return new ServiceView(StatusTag.WORLDPAY_TEST, DisplayTag.WORLDPAY_TEST, service, GatewayAccountType.TEST)
  }

  static PspOnboarding(service: Service) {
    return new ServiceView(StatusTag.PSP_ONBOARDING, DisplayTag.NOT_LIVE_YET, service, GatewayAccountType.LIVE)
  }

  static TestAccountOnly(service: Service) {
    return new ServiceView(StatusTag.TEST_ACCOUNT_ONLY, DisplayTag.NOT_LIVE_YET, service, GatewayAccountType.TEST)
  }

  static SandboxMode(service: Service) {
    return new ServiceView(StatusTag.SANDBOX_MODE, DisplayTag.SANDBOX_MODE, service, GatewayAccountType.TEST)
  }

  static Restricted(service: Service, accountType: string) {
    return new ServiceView(StatusTag.RESTRICTED, DisplayTag.NOT_TAKING_PAYMENTS, service, accountType)
  }

  static Unknown(service: Service, accountType: string) {
    return new ServiceView(StatusTag.UNKNOWN, DisplayTag.NONE, service, accountType)
  }

  static determineFor(service: Service, account: GatewayAccount) {
    return determineServiceView(service, account)
  }
}

const PaymentProvidersThatCanGoLive = [PaymentProviders.SANDBOX, PaymentProviders.STRIPE]
const ValidLivePaymentProviders = [PaymentProviders.WORLDPAY, PaymentProviders.STRIPE]

const GoLiveInProgressStages = [
  GoLiveStage.CHOSEN_PSP_GOV_BANKING_WORLDPAY,
  GoLiveStage.CHOSEN_PSP_STRIPE,
  GoLiveStage.ENTERED_ORGANISATION_ADDRESS,
  GoLiveStage.ENTERED_ORGANISATION_NAME,
  GoLiveStage.GOV_BANKING_MOTO_OPTION_COMPLETED,
]

const GoLiveRequestedStages = [GoLiveStage.TERMS_AGREED_STRIPE, GoLiveStage.TERMS_AGREED_GOV_BANKING_WORLDPAY]

const determineServiceView = (service: Service, account: GatewayAccount) => {
  const currentGoLiveStage = service.currentGoLiveStage
  const isTestGatewayAccount = account.type === GatewayAccountType.TEST
  const isLiveGatewayAccount = account.type === GatewayAccountType.LIVE
  const canGoLive = PaymentProvidersThatCanGoLive.includes(account.paymentProvider)
  const isPendingGoLive = ![GoLiveStage.LIVE, GoLiveStage.DENIED].includes(currentGoLiveStage)
  const hasActiveCredential = account.getActiveCredential() !== undefined
  const hasGoneLive = currentGoLiveStage === GoLiveStage.LIVE

  const isNotLiveYet = isTestGatewayAccount && canGoLive && isPendingGoLive
  const isInSandboxMode = isTestGatewayAccount && hasGoneLive
  const isInLiveMode = isLiveGatewayAccount && hasGoneLive
  const isWorldpayTestService = account.paymentProvider === PaymentProviders.WORLDPAY && isTestGatewayAccount

  if (account.disabled) {
    return ServiceView.Restricted(service, account.type)
  }

  if (isInLiveMode && hasActiveCredential) {
    return ServiceView.Live(service)
  }

  if (isInLiveMode && ValidLivePaymentProviders.includes(account.paymentProvider)) {
    return ServiceView.PspOnboarding(service)
  }

  if (isInLiveMode) {
    return ServiceView.Unknown(service, account.type)
  }

  if (isInSandboxMode) {
    return ServiceView.SandboxMode(service)
  }

  if (isWorldpayTestService) {
    return ServiceView.WorldpayTest(service)
  }

  if (GoLiveRequestedStages.includes(currentGoLiveStage) && isNotLiveYet) {
    return ServiceView.GoLiveRequested(service)
  }

  if (GoLiveInProgressStages.includes(currentGoLiveStage) && isNotLiveYet) {
    return ServiceView.GoLiveInProgress(service)
  }

  if (currentGoLiveStage === GoLiveStage.NOT_STARTED && isNotLiveYet) {
    return ServiceView.TestAccountOnly(service)
  }

  // this should never happen
  logger.error(
    `Service in unknown state [service_external_id: ${service.externalId}, gateway_account_external_id: ${account.externalId}]`
  )
  return ServiceView.Unknown(service, account.type)
}
