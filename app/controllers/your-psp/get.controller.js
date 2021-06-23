'use strict'

const { response } = require('../../utils/response')
const { getCredentialByExternalId, getCurrentCredential } = require('../../utils/credentials')

module.exports = (req, res, next) => {
  const { credentialId } = req.params

  try {
    const credential = getCredentialByExternalId(req.account, credentialId)
    const activeCredential = getCurrentCredential(req.account)
    const isAccountCredentialsConfigured = credential.credentials && credential.credentials.merchant_id !== undefined

    const isWorldpay3dsFlexCredentialsConfigured = req.account.worldpay_3ds_flex &&
      req.account.worldpay_3ds_flex.organisational_unit_id !== undefined &&
      req.account.worldpay_3ds_flex.organisational_unit_id.length > 0

    const is3dsEnabled = req.account.requires3ds === true

    const isWorldpay3dsFlexEnabled = is3dsEnabled && req.account.integration_version_3ds === 2

    return response(req, res, 'your-psp/index', {
      credential,
      activeCredential,
      isAccountCredentialsConfigured,
      is3dsEnabled,
      isWorldpay3dsFlexEnabled,
      isWorldpay3dsFlexCredentialsConfigured
    })
  } catch (error) {
    next(error)
  }
}
