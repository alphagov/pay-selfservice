const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { updateCollectBillingAddress } = require('@services/card-payments.service')
const paths = require('@root/paths')
const { validateOnOffToggle } = require('@utils/simplified-account/validation/on-off-toggle')

function get (req, res) {
  const collectBillingAddress = req.service.collectBillingAddress
  response(req, res, 'simplified-account/settings/card-payments/collect-billing-address', {
    currentState: collectBillingAddress ? 'on' : 'off',
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  const { isValid, isOn, errors } = await validateOnOffToggle('collectBillingAddress', req)
  if (!isValid) {
    const collectBillingAddress = req.service.collectBillingAddress
    return response(req, res, 'simplified-account/settings/card-payments/collect-billing-address', {
      errors: {
        summary: errors.errorSummary,
        formErrors: errors.formErrors
      },
      currentState: collectBillingAddress ? 'on' : 'off',
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, req.service.externalId, req.account.type)
    })
  }
  const serviceExternalId = req.service.externalId
  await updateCollectBillingAddress(serviceExternalId, isOn)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, serviceExternalId, req.account.type))
}

module.exports = {
  get,
  post
}
