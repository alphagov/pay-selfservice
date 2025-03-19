const { response } = require('@utils/response')
const paths = require('@root/paths')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const { formatAddressAsParagraph } = require('@utils/format-address-as-paragraph')

/**
 *
 * @param {SimplifiedAccountRequest} req
 * @param res
 */
function get (req, res) {
  if (!req.service?.merchantDetails) {
    return res.redirect(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.edit, req.service.externalId, req.account.type))
  }

  const organisationDetails = {
    organisationName: req.service.merchantDetails.organisationName,
    address: formatAddressAsParagraph({
      line1: req.service.merchantDetails.addressLine1,
      line2: req.service.merchantDetails.addressLine2,
      city: req.service.merchantDetails.addressCity,
      postcode: req.service.merchantDetails.addressPostcode
    }),
    telephoneNumber: req.service.merchantDetails.telephoneNumber,
    url: req.service.merchantDetails.organisationUrl
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
