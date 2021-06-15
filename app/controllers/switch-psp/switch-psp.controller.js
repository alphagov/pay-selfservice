'use strict'
const { response } = require('../../utils/response')
const { getSwitchingCredential } = require('../../utils/credentials')

function switchPSPPage (req, res, next) {
  try {
    const targetCredential = getSwitchingCredential(req.account)
    response(req, res, 'switch-psp/switch-psp', { targetCredential })
  } catch (error) {
    next(error)
  }
}

module.exports = { switchPSPPage }
