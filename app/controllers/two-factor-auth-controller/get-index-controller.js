'use strict'

const { response } = require('../../utils/response.js')

module.exports = (req, res) => {
  return response(req, res, 'twoFactorAuth/index', {
    authenticatorMethod: req.user.secondFactor
  })
}
