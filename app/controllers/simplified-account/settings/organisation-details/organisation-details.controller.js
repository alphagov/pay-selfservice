const { response } = require('../../../../utils/response')
const paths = require('../../../../paths')
const formatSimplifiedAccountPathsFor = require('../../../../utils/simplified-account/format/format-simplified-account-paths-for')

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
    editOrganisationDetailsHref: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.organisationDetails.edit, req.service.externalId, req.account.type)
  }
  return response(req, res, 'simplified-account/settings/organisation-details/index', context)
}

module.exports = {
  get,
  edit: require('./edit-organisation-details.controller')
}
