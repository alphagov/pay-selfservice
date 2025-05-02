const { response } = require('@utils/response')
const { VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY, filterNextUrl } = require('@utils/verify-psp-integration')
const { WORLDPAY } = require('@models/constants/payment-providers')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const formatPSPName = require('@utils/format-PSP-name')
const paths = require('@root/paths')
const chargeService = require('@services/charge.service')
const ChargeRequest = require('@models/ChargeRequest.class')
const urljoin = require('url-join')
const CREDENTIAL_STATE = require('@models/constants/credential-state')
const worldpayDetailsService = require('@services/worldpay-details.service')
const SELFSERVICE_URL = process.env.SELFSERVICE_URL

function get(req, res) {
  const account = req.account
  const service = req.service
  const targetCredential = account.getSwitchingCredential()
  const context = {
    paymentProvider: targetCredential.paymentProvider,
    backLink: formatSimplifiedAccountPathsFor(
      targetCredential.paymentProvider === WORLDPAY
        ? paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index
        : paths.simplifiedAccount.settings.switchPsp.switchToStripe.index,
      service.externalId,
      account.type
    ),
  }
  return response(req, res, 'simplified-account/settings/switch-psp/make-test-payment/index', context)
}

async function post(req, res, next) {
  const account = req.account
  const service = req.service
  const targetCredential = account.getSwitchingCredential()
  const chargeRequest = new ChargeRequest()
    .withAmount(200)
    .withDescription(`Live payment to verify ${formatPSPName(targetCredential.paymentProvider)} integration`)
    .withReference('VERIFY_PSP_INTEGRATION')
    .withReturnUrl(
      urljoin(
        SELFSERVICE_URL,
        formatSimplifiedAccountPathsFor(
          paths.simplifiedAccount.settings.switchPsp.makeTestPayment.inbound,
          service.externalId,
          account.type
        )
      )
    )
    .withCredentialExternalId(targetCredential.externalId)
    .withMoto(account.allowMoto)

  chargeService
    .createCharge(service.externalId, account.type, chargeRequest)
    .then((response) => {
      req.session[VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY] = response.charge_id
      res.redirect(filterNextUrl(response))
    })
    .catch((error) => {
      next(error)
    })
}

async function getInbound(req, res, next) {
  const account = req.account
  const service = req.service
  const user = req.user
  const chargeExternalId = req.session[VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY]
  delete req.session[VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY]
  const targetCredential = account.getSwitchingCredential()
  if (!chargeExternalId) {
    throw new Error('No charge found on session')
  }
  chargeService
    .getCharge(service.externalId, account.type, chargeExternalId)
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

module.exports = {
  get,
  getInbound,
  post,
}
