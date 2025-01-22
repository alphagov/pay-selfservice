const { response } = require('@utils/response')

async function get (req, res, next) {
  console.log(req.account)
  response(req, res, 'simplified-account/settings/webhooks/create', {})
}

module.exports = {
  get
}
