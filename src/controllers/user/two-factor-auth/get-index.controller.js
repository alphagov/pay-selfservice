'use strict'

const { response } = require('../../../utils/response.js')
const secondFactorMethod = require('@models/constants/second-factor-method')

module.exports = (req, res) => {
  return response(req, res, 'two-factor-auth/index', {
    authenticatorMethod: req.user.secondFactor,
    secondFactorMethod
  })
}
