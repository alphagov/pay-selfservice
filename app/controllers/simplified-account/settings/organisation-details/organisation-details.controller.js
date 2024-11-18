const { response } = require('@utils/response')
const paths = require('@root/paths')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const { formatAddressAsParagraph } = require('@utils/format-address-as-paragraph')

function get (req, res) {
  if (!req.service?.merchantDetails) {
    res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.edit, req.service.externalId, req.account.type))
  }

  const organisationDetails = {
    organisationName: req.service.merchantDetails.name,
    address: formatAddressAsParagraph({
      line1: req.service.merchantDetails.address_line1,
      line2: req.service.merchantDetails.address_line2,
      city: req.service.merchantDetails.address_city,
      postcode: req.service.merchantDetails.address_postcode
    }),
    telephoneNumber: req.service.merchantDetails.telephone_number,
    url: req.service.merchantDetails.url
  }

  const context = {
    messages: res.locals?.flash?.messages ?? [],
    organisationDetails,
    editOrganisationDetailsHref: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.edit, req.service.externalId, req.account.type)
  }
  return response(req, res, 'simplified-account/settings/organisation-details/index', context)
}

module.exports = {
  get,
  edit: require('./edit-organisation-details.controller')
}
