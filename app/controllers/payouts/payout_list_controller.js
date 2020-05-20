const { response } = require('../../utils/response.js')

const listAllServicesPayouts = function listAllServicesPayouts (req, res, next) {
  response(req, res, 'payouts/list', {})
}

module.exports = {
  listAllServicesPayouts
}
