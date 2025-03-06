const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { updateAllowGooglePay } = require('@services/card-payments.service')
const paths = require('@root/paths')
const validateOnOffToggle = require('@utils/simplified-account/validation/on-off-toggle')

function get (req, res) {
  const googlePay = req.account?.allowGooglePay
  response(req, res, 'simplified-account/settings/card-payments/google-pay', {
    currentState: googlePay ? 'on' : 'off',
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  const { isValid, isOn, errors } = await validateOnOffToggle('googlePay', req)
  if (!isValid) {
    const googlePay = req.account?.allowGooglePay
    return response(req, res, 'simplified-account/settings/card-payments/google-pay', {
      errors: {
        summary: errors.errorSummary,
        formErrors: errors.formErrors
      },
      currentState: googlePay ? 'on' : 'off',
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, req.service.externalId, req.account.type)
    })
  }
  const serviceExternalId = req.service.externalId
  const accountType = req.account.type
  await updateAllowGooglePay(serviceExternalId, accountType, isOn)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, serviceExternalId, accountType))
}

module.exports = {
  get,
  post
}
