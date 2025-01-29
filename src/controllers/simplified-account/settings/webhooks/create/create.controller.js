const { response } = require('@utils/response')

async function get (req, res) {
  response(req, res, 'simplified-account/settings/webhooks/create', {})
}

module.exports = {
  get
}
