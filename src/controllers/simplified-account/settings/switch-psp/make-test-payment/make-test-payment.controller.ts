import type { ServiceRequest, ServiceResponse } from '@utils/types/express'
import type { NextFunction } from 'express'
import { response } from '@utils/response'
import { VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY, filterNextUrl } from '@utils/verify-psp-integration'
import { ADYEN, STRIPE, WORLDPAY } from '@models/constants/payment-providers'
import formatPSPName from '@utils/format-PSP-name'
import paths from '@root/paths'
import { createCharge, getCharge } from '@services/charge.service'
import ChargeRequest from '@models/charge/ChargeRequest.class'
import CREDENTIAL_STATE from '@models/constants/credential-state'
import worldpayDetailsService from '@services/worldpay-details.service'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import urlJoin from '@utils/simplified-account/format/url'
import { PaymentProvider } from '@models/constants/payment-provider'

const SELFSERVICE_URL = process.env.SELFSERVICE_URL!

function get(req: ServiceRequest, res: ServiceResponse) {
  const account = req.account
  const service = req.service
  const paymentProvider = account.getSwitchingCredential().paymentProvider

  const backLinks: Partial<Record<PaymentProvider, string>> = {
    [WORLDPAY]: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
      service.externalId,
      account.type
    ),
    [STRIPE]: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToStripe.index,
      service.externalId,
      account.type
    ),
    [ADYEN]: formatServiceAndAccountPathsFor(
      paths.simplifiedAccount.settings.switchPsp.switchToAdyen.index,
      service.externalId,
      account.type
    ),
  }

  const template =
    paymentProvider === ADYEN
      ? 'simplified-account/settings/switch-psp/switch-to-adyen/payment-info'
      : 'simplified-account/settings/switch-psp/make-test-payment/index'

  const context = {
    paymentProvider,
    backLink: backLinks[paymentProvider],
  }
  return response(req, res, template, context)
}

function post(req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
  const account = req.account
  const service = req.service
  const targetCredential = account.getSwitchingCredential()
  const amount = targetCredential.paymentProvider === ADYEN ? 100 : 200
  const chargeRequest = new ChargeRequest()
    .withAmount(amount)
    .withDescription(`Live payment to verify ${formatPSPName(targetCredential.paymentProvider)} integration`)
    .withReference('VERIFY_PSP_INTEGRATION')
    .withReturnUrl(
      urlJoin(
        SELFSERVICE_URL,
        formatServiceAndAccountPathsFor(
          paths.simplifiedAccount.settings.switchPsp.makeTestPayment.inbound,
          service.externalId,
          account.type
        )
      )
    )
    .withCredentialExternalId(targetCredential.externalId)
    .withMoto(account.allowMoto)

  createCharge(service.externalId, account.type, chargeRequest)
    .then((response) => {
      req.session[VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY] = response.chargeId
      res.redirect(filterNextUrl(response) as string)
    })
    .catch((error) => {
      next(error)
    })
}

function getInbound(req: ServiceRequest, res: ServiceResponse, next: NextFunction) {
  const account = req.account
  const service = req.service
  const user = req.user
  const chargeExternalId = req.session[VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY] as string
  delete req.session[VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY]
  const targetCredential = account.getSwitchingCredential()
  if (!chargeExternalId) {
    throw new Error('No charge found on session')
  }

  getCharge(service.externalId, account.type, chargeExternalId)
    .then(async (charge) => {
      if (charge.state.status === 'success') {
        // TODO move me to more generic service
        await worldpayDetailsService.updateCredentialState(
          service.externalId,
          account.type,
          targetCredential.externalId,
          user.externalId,
          CREDENTIAL_STATE.VERIFIED
        )
        req.flash('messages', {
          state: 'success',
          icon: '&check;',
          heading: 'Payment verified',
          body: `This service is ready to switch to ${formatPSPName(targetCredential.paymentProvider)}`,
        })
      } else {
        req.flash('messages', {
          state: 'error',
          heading: 'There is a problem',
          body: 'The payment has failed, please try again. If you need help, contact govuk-pay-support@digital.cabinet-office.gov.uk',
        })
      }
      next()
    })
    .catch((err) => next(err))
}

export { get, getInbound, post }
