const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { updateCollectBillingAddress } = require('@services/card-payments.service')
const { validateOnOffField } = require('@utils/simplified-account/validation/on-off-field-validator')
const paths = require('@root/paths')

function get (req, res) {
  const collectBillingAddress = req.service.collectBillingAddress
  response(req, res, 'simplified-account/settings/card-payments/collect-billing-address', {
    currentState: collectBillingAddress ? 'on' : 'off',
    backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, req.service.externalId, req.account.type)
  })
}

async function post (req, res) {
  const { value: userPreference, error } = validateOnOffField(req.body.collectBillingAddress)
  if (error) {
    const collectBillingAddress = req.service.collectBillingAddress
    return response(req, res, 'simplified-account/settings/card-payments/collect-billing-address', {
      currentState: collectBillingAddress ? 'on' : 'off',
      backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, req.service.externalId, req.account.type)
    })
  }
  const serviceExternalId = req.service.externalId
  await updateCollectBillingAddress(serviceExternalId, userPreference)
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.cardPayments.index, serviceExternalId, req.account.type))
}

module.exports = {
  get,
  post
}
