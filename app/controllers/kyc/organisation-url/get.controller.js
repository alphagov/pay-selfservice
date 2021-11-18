'use strict'

const { response } = require('../../../utils/response')
const { isSwitchingCredentialsRoute, isAdditionalKycDataRoute, getCurrentCredential } = require('../../../utils/credentials')

module.exports = (req, res, next) => {
  const isSwitchingCredentials = isSwitchingCredentialsRoute(req)
  const collectingAdditionalKycData = isAdditionalKycDataRoute(req)
  const currentCredential = getCurrentCredential(req.account)

  if (collectingAdditionalKycData && !req.account.requires_additional_kyc_data) {
    return next(new Error('requires_additional_kyc_data flag is not enabled for gateway account'))
  }

  return response(req, res, 'kyc/organisation-url', {
    isSwitchingCredentials, collectingAdditionalKycData, currentCredential
  })
}
