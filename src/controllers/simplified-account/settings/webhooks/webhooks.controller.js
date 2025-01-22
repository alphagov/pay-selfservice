const { response } = require('@utils/response')

async function get (req, res, next) {
  response(req, res, 'simplified-account/settings/webhooks/index', {})
}

module.exports = { get }
