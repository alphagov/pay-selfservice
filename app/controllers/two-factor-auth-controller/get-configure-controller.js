'use strict'

// NPM dependencies
const logger = require('winston')
const qrcode = require('qrcode')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')
const userService = require('../../services/user_service.js')
const errorView = require('../../utils/response.js').renderErrorView

const PAGE_PARAMS = {
  profile: paths.user.profile,
  index: paths.user.twoFactorAuth.index,
  configure: paths.user.twoFactorAuth.configure
}

const makeOtpUrl = (username, secret) => {
  return `otpauth://totp/GOV.UK%20Pay:${encodeURIComponent(username)}?secret=${encodeURIComponent(secret)}&issuer=GOV.UK%20Pay&algorithm=SHA1&digits=6&period=30`
}

module.exports = (req, res) => {
  userService.findByExternalId(req.user.externalId)
    .then(user => {
      const otpUrl = makeOtpUrl(user.username, user.provisionalOtpKey)
      PAGE_PARAMS.prettyPrintedSecret = user.provisionalOtpKey.match(/.{4}/g).join(' ')
      PAGE_PARAMS.otpUrl = otpUrl
      return qrcode.toDataURL(otpUrl)
    })
    .then(qrCodeDataUrl => {
      PAGE_PARAMS.qrCodeDataUrl = qrCodeDataUrl
      return response(req, res, 'twoFactorAuth/configure', PAGE_PARAMS)
    })
    .catch((err) => {
      logger.error(`[requestId=${req.correlationId}] Provisioning new OTP key failed - ${err.message}`)
      errorView(req, res, 'Internal server error')
    })
}
