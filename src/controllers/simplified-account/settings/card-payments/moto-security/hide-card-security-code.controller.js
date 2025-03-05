const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')
const { updateMotoMaskSecurityCode } = require('@services/card-payments.service')
const validateOnOffToggle = require('@utils/simplified-account/validation/on-off-toggle')

function get (req, res) {
  const account = req.account
  const service = req.service
  return response(req, res, 'simplified-account/settings/card-payments/moto-security/hide-card-security-code', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, service.externalId, account.type),
    currentState: account.motoMaskCardSecurityCode ? 'on' : 'off'
  })
}

async function post (req, res) {
  const { isValid, isOn, errors } = await validateOnOffToggle('hideCardSecurityCode', req)
  const account = req.account
  const service = req.service
  if (!isValid) {
    return response(req, res, 'simplified-account/settings/card-payments/moto-security/hide-card-security-code', {
      errors: {
        summary: errors.errorSummary,
        formErrors: errors.formErrors
      },
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, service.externalId, account.type),
      currentState: account.motoMaskCardSecurityCode ? 'on' : 'off'
    })
  }
  await updateMotoMaskSecurityCode(service.externalId, account.type, isOn)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, service.externalId, account.type))
}

module.exports = {
  get,
  post
}
