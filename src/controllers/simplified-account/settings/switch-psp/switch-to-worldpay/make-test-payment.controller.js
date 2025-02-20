const { response } = require('@utils/response')
const { VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY, filterNextUrl } = require('@utils/verify-psp-integration')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const formatPSPName = require('@utils/format-PSP-name')
const paths = require('@root/paths')
const chargeService = require('@services/charge.service')
const ChargeRequest = require('@models/ChargeRequest.class')
const urljoin = require('url-join')
const CREDENTIAL_STATE = require('@models/constants/credential-state')
const worldpayDetailsService = require('@services/worldpay-details.service')
const { WorldpayTasks } = require('@models/WorldpayTasks.class')
const TASK_STATUS = require('@models/constants/task-status')
const { TaskAccessedOutOfSequenceError } = require('@root/errors')
const SELFSERVICE_URL = process.env.SELFSERVICE_URL

function get (req, res, next) {
  const account = req.account
  const service = req.service
  canStartTask(account, service)
  const context = {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
      service.externalId, account.type)
  }
  return response(req, res, 'simplified-account/settings/switch-psp/switch-to-worldpay/make-a-test-payment', context)
}

async function post (req, res, next) {
  const account = req.account
  const service = req.service
  canStartTask(account, service)
  const targetCredential = account.getSwitchingCredential()
  const chargeRequest = new ChargeRequest()
    .withAmount(200)
    .withDescription('Live payment to verify Worldpay integration')
    .withReference('VERIFY_PSP_INTEGRATION')
    .withReturnUrl(urljoin(SELFSERVICE_URL, formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.makeTestPayment.inbound,
      service.externalId, account.type)))
    .withCredentialExternalId(targetCredential.externalId)
    .withMoto(account.allowMoto)

  chargeService.createCharge(service.externalId, account.type, chargeRequest)
    .then((response) => {
      req.session[VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY] = response.charge_id
      res.redirect(filterNextUrl(response))
    })
    .catch((error) => {
      next(error)
    })
}

async function getInbound (req, res, next) {
  const account = req.account
  const service = req.service
  canStartTask(account, service)
  const user = req.user
  const chargeExternalId = req.session[VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY]
  delete req.session[VERIFY_PSP_INTEGRATION_CHARGE_EXTERNAL_ID_KEY]
  const targetCredential = account.getSwitchingCredential()
  if (!chargeExternalId) {
    throw new Error('No charge found on session')
  }
  chargeService.getCharge(service.externalId, account.type, chargeExternalId)
    .then(async (charge) => {
      if (charge.state.status === 'success') {
        await worldpayDetailsService.updateCredentialState(service.externalId, account.type, targetCredential.externalId, user.externalId, CREDENTIAL_STATE.VERIFIED)
        req.flash('messages', {
          state: 'success',
          icon: '&check;',
          heading: 'Payment verified',
          body: `This service is ready to switch to ${formatPSPName(targetCredential.paymentProvider)}`
        })
      } else {
        req.flash('messages', {
          state: 'error',
          heading: 'There is a problem',
          body: 'The payment has failed. Check your Worldpay credentials and try again. If you need help, contact govuk-pay-support@digital.cabinet-office.gov.uk'
        })
      }
      res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
        service.externalId, account.type))
    })
    .catch(err => next(err))
}

function canStartTask (account, service) {
  const worldpayTasks = new WorldpayTasks(account, service.externalId, true)
  const thisTask = worldpayTasks.findTask('make-a-live-payment')
  if (thisTask.status === TASK_STATUS.CANNOT_START) {
    throw new TaskAccessedOutOfSequenceError(
      `Attempted to access task page before completing requisite tasks [task: ${thisTask.id}, serviceExternalId: ${service.externalId}]`,
      formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
        service.externalId, account.type)
    )
  }
}

module.exports = {
  get,
  getInbound,
  post
}
