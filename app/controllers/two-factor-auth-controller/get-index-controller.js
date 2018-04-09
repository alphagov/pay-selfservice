'use strict'

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')

const PAGE_PARAMS = {
  profile: paths.user.profile,
  index: paths.user.twoFactorAuth.index
}

module.exports = (req, res) => {
  PAGE_PARAMS.authenticatorMethod = req.user.secondFactor

  return response(req, res, 'twoFactorAuth/index', PAGE_PARAMS)
}
