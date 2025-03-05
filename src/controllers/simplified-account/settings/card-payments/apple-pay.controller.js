const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { updateAllowApplePay } = require('@services/card-payments.service')
const paths = require('@root/paths')
const validateOnOffToggle = require('@utils/simplified-account/validation/on-off-toggle')

function get (req, res) {
  const applePay = req.account?.allowApplePay
  response(req, res, 'simplified-account/settings/card-payments/apple-pay', {
    currentState: applePay ? 'on' : 'off',
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  const { isValid, isOn, errors } = await validateOnOffToggle('applePay', req)
  if (!isValid) {
    const applePay = req.account?.allowApplePay
    return response(req, res, 'simplified-account/settings/card-payments/apple-pay', {
      errors: {
        summary: errors.errorSummary,
        formErrors: errors.formErrors
      },
      currentState: applePay ? 'on' : 'off',
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, req.service.externalId, req.account.type)
    })
  }
  const serviceExternalId = req.service.externalId
  const accountType = req.account.type
  await updateAllowApplePay(serviceExternalId, accountType, isOn)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, serviceExternalId, accountType))
}

module.exports = {
  get,
  post
}
