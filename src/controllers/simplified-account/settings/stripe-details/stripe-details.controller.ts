import * as bankDetails from './bank-details/bank-details.controller'
import * as companyNumber from './company-number/company-number.controller'
import * as director from './director/director.controller'
import * as governmentEntityDocument from './government-entity-document/government-entity-document.controller'
import * as organisationDetails from './organisation-details/organisation-details.controller'
import * as responsiblePerson from './responsible-person/responsible-person.controller'
import * as vatNumber from './vat-number/vat-number.controller'
import { ServiceRequest, ServiceResponse } from '@utils/types/express'
import { response } from '@utils/response'
import {
  getStripeAccountOnboardingDetails,
  getStripeAccountIdForGatewayAccount,
} from '@services/stripe-details.service'
import paths from '@root/paths'
import StripeTasks from '@models/task-workflows/StripeTasks.class'
import PaymentProviders from '@models/constants/payment-providers'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import StripeAccountSetup from '@models/StripeAccountSetup.class'

async function getAccountDetails(req: ServiceRequest, res: ServiceResponse) {
  const account = req.account
  const service = req.service
  await getStripeAccountOnboardingDetails(service, account).then((result) => {
    res.json({
      ...result,
    })
  })
}

async function get(
  req: ServiceRequest & {
    gatewayAccountStripeProgress: NonNullable<StripeAccountSetup>
  },
  res: ServiceResponse
) {
  const javascriptUnavailable = req.query.noscript === 'true'
  const account = req.account
  const service = req.service
  const credentialIsActive = account.getActiveCredential() !== undefined
  const stripeAccountId = getStripeAccountIdForGatewayAccount(account)
  const stripeTasks = new StripeTasks(req.gatewayAccountStripeProgress, account, service.externalId)
  let answers = {}
  // load account onboarding details synchronously if javascript is unavailable
  if (!stripeTasks.hasIncompleteTasks() && javascriptUnavailable) {
    const stripeAccountOnboardingDetails = await getStripeAccountOnboardingDetails(service, account)
    answers = {
      ...stripeAccountOnboardingDetails,
    }
  }
  return response(req, res, 'simplified-account/settings/stripe-details/index', {
    javascriptUnavailable,
    accountDetailsPath: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.stripeDetails.accountDetails,
      service.externalId,
      account.type
    ),
    messages: res.locals?.flash?.messages ?? [
      ...(!credentialIsActive && !stripeTasks.hasIncompleteTasks()
        ? [
            {
              state: 'info',
              heading: 'Stripe is still checking your information',
              body: 'We will contact you if there is a problem',
            },
          ]
        : []),
    ],
    tasks: stripeTasks.tasks,
    incompleteTasks: stripeTasks.hasIncompleteTasks(),
    credentialIsActive,
    serviceExternalId: service.externalId,
    answers,
    currentPsp: req.account.paymentProvider,
    stripeAccountId,
    providerSwitchEnabled: account.providerSwitchEnabled,
    ...(req.account.providerSwitchEnabled && {
      switchingPsp: PaymentProviders.WORLDPAY, // Stripe can only switch to Worldpay (currently)
      switchPspLink: formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
        req.service.externalId,
        req.account.type
      ),
    }),
  })
}

export {
  get,
  getAccountDetails,
  bankDetails,
  companyNumber,
  vatNumber,
  responsiblePerson,
  director,
  organisationDetails,
  governmentEntityDocument,
}
