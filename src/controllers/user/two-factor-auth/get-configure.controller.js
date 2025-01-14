'use strict'

const lodash = require('lodash')
const qrcode = require('qrcode')

const logger = require('../../../utils/logger')(__filename)
const { response } = require('../../../utils/response.js')
const paths = require('../../../paths')
const secondFactorMethod = require('../../../models/second-factor-method')

module.exports = async function showConfigureSecondFactorMethod (req, res) {
  const method = lodash.get(req, 'session.pageData.twoFactorAuthMethod', secondFactorMethod.APP)
  const recovered = lodash.get(req, 'session.pageData.configureTwoFactorAuthMethodRecovered', {})
  lodash.unset(req, 'session.pageData.configureTwoFactorAuthMethodRecovered')

  const prettyPrintedSecret = req.user.provisionalOtpKey.match(/.{4}/g).join(' ')
  const otpUrl = `otpauth://totp/GOV.UK%20Pay:${encodeURIComponent(req.user.email)}?secret=${encodeURIComponent(req.user.provisionalOtpKey)}&issuer=GOV.UK%20Pay&algorithm=SHA1&digits=6&period=30`

  try {
    const qrCodeDataUrl = await qrcode.toDataURL(otpUrl)
    const pageData = {
      method,
      prettyPrintedSecret,
      qrCodeDataUrl,
      errors: recovered.errors,
      secondFactorMethod
    }
    return response(req, res, 'two-factor-auth/configure', pageData)
  } catch (err) {
    logger.error(`Failed to generate QR code - ${err.message}`)
    req.flash('genericError', 'Something went wrong. Please try again or contact support.')
    return res.redirect(paths.user.profile.twoFactorAuth.index)
  }
}
