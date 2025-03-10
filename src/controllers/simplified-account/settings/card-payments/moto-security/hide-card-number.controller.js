const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { updateMotoMaskCardNumber } = require('@services/card-payments.service')
const paths = require('@root/paths')
const { validateOnOffToggle } = require('@utils/simplified-account/validation/on-off-toggle')

function get (req, res) {
  const account = req.account
  const service = req.service
  return response(req, res, 'simplified-account/settings/card-payments/moto-security/hide-card-number', {
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, service.externalId, account.type),
    currentState: account.motoMaskCardNumber ? 'on' : 'off'
  })
}

async function post (req, res) {
  const { isValid, isOn, errors } = await validateOnOffToggle('hideCardNumber', req)
  const account = req.account
  const service = req.service
  if (!isValid) {
    return response(req, res, 'simplified-account/settings/card-payments/moto-security/hide-card-number', {
      errors: {
        summary: errors.errorSummary,
        formErrors: errors.formErrors
      },
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, service.externalId, account.type),
      currentState: account.motoMaskCardNumber ? 'on' : 'off'
    })
  }

  const serviceExternalId = req.service.externalId
  const accountType = req.account.type
  await updateMotoMaskCardNumber(serviceExternalId, accountType, isOn)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, serviceExternalId, accountType))
}

module.exports = {
  get,
  post
}
