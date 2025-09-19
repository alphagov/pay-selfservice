import Service from '@models/service/Service.class'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import User from '@models/user/User.class'
import GoLiveStage from '@models/constants/go-live-stage'
import PaymentProviders, { STRIPE, WORLDPAY } from '@models/constants/payment-providers'
import PspTestAccountStage from '@models/constants/psp-test-account-stage'
import { getProducts } from '@services/products.service'
import createLogger from '@utils/logger'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import CredentialState from '@models/constants/credential-state'
import { getConnectorStripeAccountSetup, getStripeAccountCapabilities } from '@services/stripe-details.service'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import { ProductType } from '@models/products/product-type'

const logger = createLogger(__filename)

const possibleActions = {
  demoPayment: 0,
  testPaymentLink: 1,
  paymentLinks: 2,
  requestPspTestAccount: 3,
  goLive: 4,
  telephonePaymentLink: 5,
  switchMode: 6,
}

const goLiveStartedStages = [
  GoLiveStage.ENTERED_ORGANISATION_NAME,
  GoLiveStage.ENTERED_ORGANISATION_ADDRESS,
  GoLiveStage.CHOSEN_PSP_STRIPE,
  GoLiveStage.CHOSEN_PSP_GOV_BANKING_WORLDPAY,
  GoLiveStage.GOV_BANKING_MOTO_OPTION_COMPLETED,
]

const goLiveRequestedStages = [GoLiveStage.TERMS_AGREED_STRIPE, GoLiveStage.TERMS_AGREED_GOV_BANKING_WORLDPAY]

const goLiveLinkNotDisplayedStages = [GoLiveStage.LIVE, GoLiveStage.DENIED]

const displayRequestTestStripeAccountLink = (service: Service, account: GatewayAccount, user: User) => {
  // Since 29/08/2024, services that identified as local govt were automatically allocated Stripe test accounts
  // Services created after that date don't need a link to create a Stripe test account
  // this change was deployed in PR #4256 at approx. 10:08 UTC so this time is used as the cutoff
  const serviceCreatedBeforeOrgTypeCaptured = new Date(service.createdDate) <= new Date('2024-08-29T10:08:00Z')
  return (
    account.paymentProvider === PaymentProviders.SANDBOX &&
    service.currentGoLiveStage !== GoLiveStage.LIVE &&
    serviceCreatedBeforeOrgTypeCaptured &&
    service.currentPspTestAccountStage !== PspTestAccountStage.CREATED &&
    user.hasPermission(service.externalId, 'psp-test-account-stage:update')
  )
}

const displayGoLiveLink = (service: Service, account: GatewayAccount, user: User) => {
  return (
    account.type === GatewayAccountType.TEST &&
    !goLiveLinkNotDisplayedStages.includes(service.currentGoLiveStage) &&
    user.hasPermission(service.externalId, 'go-live-stage:read')
  )
}

const displayDemoAndTestPaymentLinks = (account: GatewayAccount) => {
  return (
    account.paymentProvider === PaymentProviders.SANDBOX ||
    (account.paymentProvider === PaymentProviders.STRIPE && account.type === GatewayAccountType.TEST)
  )
}

const displaySwitchMode = (service: Service, account: GatewayAccount) => {
  if (account.type === GatewayAccountType.LIVE) {
    return true
  }

  if (account.type === GatewayAccountType.TEST && service.currentGoLiveStage === GoLiveStage.LIVE) {
    return true
  }

  return false
}

const getTelephonePaymentLink = async (user: User, service: Service, gatewayAccountId: number) => {
  if (service.agentInitiatedMotoEnabled && user.hasPermission(service.externalId, 'agent-initiated-moto:create')) {
    try {
      const telephonePaymentLinks = await getProducts(gatewayAccountId, ProductType.AGENT_INITIATED_MOTO)
      if (telephonePaymentLinks.length >= 1) {
        return telephonePaymentLinks[0].links.pay.href
      }
    } catch (err) {
      logger.error(`Calling products failed for gateway account [gateway_account_id: ${gatewayAccountId}]`, err)
    }
  }
  return undefined
}

const getActionsToDisplay = (
  service: Service,
  account: GatewayAccount,
  user: User,
  displayTelephonePaymentLink: boolean
) => {
  const actionsToDisplay = []

  if (displayDemoAndTestPaymentLinks(account)) {
    actionsToDisplay.push(possibleActions.demoPayment)
    actionsToDisplay.push(possibleActions.testPaymentLink)
  } else {
    actionsToDisplay.push(possibleActions.paymentLinks)
  }

  if (displayGoLiveLink(service, account, user) && !isWorldpayTestService(service, account)) {
    actionsToDisplay.push(possibleActions.goLive)
  }

  if (displayRequestTestStripeAccountLink(service, account, user)) {
    actionsToDisplay.push(possibleActions.requestPspTestAccount)
  }

  if (displayTelephonePaymentLink) {
    actionsToDisplay.push(possibleActions.telephonePaymentLink)
  }

  if (displaySwitchMode(service, account)) {
    actionsToDisplay.push(possibleActions.switchMode)
  }

  return actionsToDisplay
}

const getGoLiveStatus = (service: Service) => {
  if (goLiveStartedStages.includes(service.currentGoLiveStage)) {
    return 'go-live-started'
  }

  if (goLiveRequestedStages.includes(service.currentGoLiveStage)) {
    return 'go-live-requested'
  }

  if (goLiveLinkNotDisplayedStages.includes(service.currentGoLiveStage)) {
    return 'go-live-not-available'
  }

  return 'go-live-not-started'
}

const getConfigurePSPAccountLink = (service: Service, account: GatewayAccount) => {
  const credential = account.getCurrentCredential()
  const paymentProvider = credential?.paymentProvider

  if (!paymentProvider || ![WORLDPAY, STRIPE].includes(paymentProvider)) {
    return undefined
  }

  const simplifiedPaths = {
    [WORLDPAY]: paths.simplifiedAccount.settings.worldpayDetails.index,
    [STRIPE]: paths.simplifiedAccount.settings.stripeDetails.index,
  }

  return formatServiceAndAccountPathsFor(simplifiedPaths[paymentProvider], service.externalId, account.type)
}

const getAccountStatus = async (account: GatewayAccount, service: Service) => {
  const currentCredential = account.getCurrentCredential()
  const unconfigured = currentCredential?.state === CredentialState.CREATED
  return {
    disabled: account.disabled,
    type: account.type,
    unconfigured,
    paymentProvider: currentCredential?.paymentProvider,
    isSwitching: account.providerSwitchEnabled,
    ...(account.providerSwitchEnabled && {
      targetPaymentProvider: account.getSwitchingCredential().paymentProvider,
    }),
    ...(currentCredential?.paymentProvider === PaymentProviders.STRIPE &&
      (await getStripeAccountStatus(account, service))),
  }
}

const getStripeAccountStatus = async (account: GatewayAccount, service: Service) => {
  try {
    const gatewayAccountStripeProgress = await getConnectorStripeAccountSetup(service.externalId, account.type)
    const stripeAccount = await getStripeAccountCapabilities(account)
    return {
      gatewayAccountStripeProgress,
      stripeAccount,
    }
  } catch (err) {
    logger.error('Problem retrieving Stripe account details', err)
  }
  return undefined
}

const isWorldpayTestService = (service: Service, account: GatewayAccount) => {
  return (
    service.gatewayAccountIds.length === 1 &&
    account.id === parseInt(service.gatewayAccountIds[0]) &&
    account.type === GatewayAccountType.TEST &&
    account.paymentProvider === PaymentProviders.WORLDPAY
  )
}

export {
  possibleActions,
  getConfigurePSPAccountLink,
  getTelephonePaymentLink,
  getActionsToDisplay,
  getGoLiveStatus,
  getAccountStatus,
  isWorldpayTestService,
}
