const { response } = require('@utils/response')

function get (req, res, next) {
  const context = {}
  return response(req, res, 'simplified-account/settings/switch-psp/switch-to-worldpay/index', context)
}

module.exports = {
  get
}
