'use strict'

// NPM dependencies
const logger = require('winston')
const qrcode = require('qrcode')

// Local dependencies
const {response} = require('../../utils/response.js')
const paths = require('../../paths')

module.exports = (req, res) => {
  const PAGE_PARAMS = {
    profile: paths.user.profile,
    index: paths.user.twoFactorAuth.index,
    configure: paths.user.twoFactorAuth.configure
  }
  PAGE_PARAMS.prettyPrintedSecret = req.user.provisionalOtpKey.match(/.{4}/g).join(' ')
  const otpUrl = `otpauth://totp/GOV.UK%20Pay:${encodeURIComponent(req.user.username)}?secret=${encodeURIComponent(req.user.provisionalOtpKey)}&issuer=GOV.UK%20Pay&algorithm=SHA1&digits=6&period=30`

  qrcode.toDataURL(otpUrl)
    .then(url => {
      PAGE_PARAMS.qrCodeDataUrl = url
      return response(req, res, 'twoFactorAuth/configure', PAGE_PARAMS)
    })
    .catch(err => {
      logger.error(`[requestId=${req.correlationId}] Failed to generate QR code - ${err.message}`)
      req.flash('genericError', `<h2>Internal server error, please try again</h2>`)
      return res.redirect(paths.user.twoFactorAuth.index)
    })
}
