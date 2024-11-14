const { countries } = require('@govuk-pay/pay-js-commons').utils

const { response } = require('@utils/response')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')

function get (req, res) {
  const organisationDetails = {
    organisationName: '',
    address: '',
    telephoneNumber: '',
    websiteAddress: ''
  }
  const context = {
    messages: res.locals?.flash?.messages ?? [],
    organisationDetails,
    submitLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.edit, req.service.externalId, req.account.type),
    countries: countries.govukFrontendFormatted()
  }
  return response(req, res, 'simplified-account/settings/organisation-details/edit-organisation-details', context)
}

function post (req, res) {
  res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.index, req.service.externalId, req.account.type))
}

module.exports = {
  get,
  post
}
