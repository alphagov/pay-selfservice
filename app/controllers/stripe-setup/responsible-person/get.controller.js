'use strict'

// Local dependencies
const response = require('../../../utils/response')

module.exports = (req, res) => {
  if (req.account.payment_provider.toLowerCase() !== 'stripe') {
    res.status(404)
    res.render('404')
    return
  }
  return response.response(req, res, 'stripe-setup/responsible-person/index')
}
