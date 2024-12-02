const { response } = require('@utils/response')

function get (req, res) {
  response(req, res, 'simplified-account/settings/card-types/index', { })
}

module.exports = {
  get
}
