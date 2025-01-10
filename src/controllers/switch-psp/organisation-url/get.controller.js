'use strict'

const { response } = require('../../../utils/response')
const { isSwitchingCredentialsRoute, getCurrentCredential } = require('../../../utils/credentials')

module.exports = (req, res, next) => {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const currentCredential = getCurrentCredential(req.account)

  return response(req, res, 'switch-psp/organisation-url', {
    isSwitchingCredentials, currentCredential
  })
}
