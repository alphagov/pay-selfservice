import type { NextFunction } from 'express'
import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import formatPSPName from '@utils/format-PSP-name'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import { response } from '@utils/response'
import StripeTasks from '@models/StripeTasks.class'
import TaskStatus from '@models/constants/task-status'
import GatewayAccountSwitchPaymentProviderRequest from '@models/gateway-account/GatewayAccountSwitchPaymentProviderRequest.class'
import { getConnectorStripeAccountSetup } from '@services/stripe-details.service'
import { completePaymentServiceProviderSwitch } from '@services/gateway-accounts.service'
import paths from '@root/paths'

async function get(req: ServiceRequest, res: ServiceResponse) {
  const account = req.account
  const service = req.service
  const stripeAccountSetup = await getConnectorStripeAccountSetup(service.externalId, account.type)
  const stripesTasks = new StripeTasks(stripeAccountSetup, account, service.externalId)
  const stripeVerificationPending =
    stripesTasks.findTaskById('make-a-live-payment').status === TaskStatus.CANNOT_START &&
    stripesTasks.findTaskById('stripe-gov-entity-doc').status === TaskStatus.COMPLETED_CANNOT_START
  return response(req, res, 'simplified-account/settings/switch-psp/switch-to-stripe/index', {
    messages: res.locals.flash?.messages ?? [],
    currentPsp: req.account.paymentProvider,
    incompleteTasks: stripesTasks.hasIncompleteTasks(),
    tasks: stripesTasks.tasks,
    stripeVerificationPending,
  })
}

async function post(req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
  const account = req.account
  const service = req.service
  const user = req.user
  const targetCredential = account.getSwitchingCredential()
  const connectorStripeAccountSetup = await getConnectorStripeAccountSetup(service.externalId, account.type)
  const stripeTasks = new StripeTasks(connectorStripeAccountSetup, account, service.externalId)

  if (stripeTasks.hasIncompleteTasks()) {
    req.flash('messages', {
      state: 'error',
      heading: 'There is a problem',
      body: 'You cannot switch providers until all required tasks are completed',
    })
    return res.redirect(
      formatServiceAndAccountPathsFor(
        paths.simplifiedAccount.settings.switchPsp.switchToStripe.index,
        service.externalId,
        account.type
      )
    )
  }

  const switchProviderRequest = new GatewayAccountSwitchPaymentProviderRequest()
    .withUserExternalId(user.externalId)
    .withGatewayAccountCredentialExternalId(targetCredential.externalId)

  completePaymentServiceProviderSwitch(service.externalId, account.type, switchProviderRequest)
    .then(() => {
      req.flash('messages', {
        state: 'success',
        icon: '&check;',
        heading: `Service connected to ${formatPSPName(targetCredential.paymentProvider)}`,
        body: 'This service can now take payments',
      })
      res.redirect(
        formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.stripeDetails.index,
          service.externalId,
          account.type
        )
      )
    })
    .catch((err) => next(err))
}

export = {
  get,
  post,
}
