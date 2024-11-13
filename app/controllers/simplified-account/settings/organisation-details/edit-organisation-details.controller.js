const { response } = require('../../../../utils/response')

function get (req, res) {
  const organisationDetails = {
    organisationName: '',
    address: '',
    telephoneNumber: '',
    websiteAddress: ''
  }
  const context = {
    messages: res.locals?.flash?.messages ?? [],
    organisationDetails
  }
  return response(req, res, 'simplified-account/settings/organisation-details/edit-organisation-details', context)
}

module.exports = {
  get
}
