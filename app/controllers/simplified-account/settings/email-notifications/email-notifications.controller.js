const { response } = require('../../../../utils/response')

function get (req, res) {
  return response(req, res, 'simplified-account/settings/email-notifications/index')
}

module.exports = {
  get
}
