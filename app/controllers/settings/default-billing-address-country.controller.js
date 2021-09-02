'use strict'

const paths = require('../../paths')
const { response } = require('../../utils/response')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const getAdminUsersClient = require('../../services/clients/adminusers.client')
const adminUsersClient = getAdminUsersClient()

const GB_COUNTRY_CODE = 'GB'

function showDefaultBillingAddressCountry (req, res) {
  const defaultToUK = req.service.defaultBillingAddressCountry === GB_COUNTRY_CODE
  response(req, res, 'default-billing-address-country/index', { defaultToUK })
}

async function updateDefaultBillingAddressCountry (req, res, next) {
  try {
    const defaultToUK = req.body['uk-as-default-billing-address-country'] === 'on'
    const countryCode = defaultToUK ? GB_COUNTRY_CODE : null
    await adminUsersClient.updateDefaultBillingAddressCountry(req.service.externalId, countryCode, req.correlationId)
    req.flash('generic', `United Kingdom as the default billing address: ${defaultToUK ? 'On' : 'Off'}`)
    res.redirect(formatAccountPathsFor(paths.account.settings.index, req.account && req.account.external_id))
  } catch (err) {
    next(err)
  }
}

module.exports = {
  showDefaultBillingAddressCountry,
  updateDefaultBillingAddressCountry
}
