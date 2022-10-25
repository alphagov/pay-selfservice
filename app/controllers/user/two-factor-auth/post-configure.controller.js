'use strict'

const lodash = require('lodash')

const paths = require('../../../paths')
const userService = require('../../../services/user.service.js')
const secondFactorMethod = require('../../../models/second-factor-method')
const { RESTClientError } = require('../../../errors')

module.exports = async function postUpdateSecondFactorMethod (req, res, next) {
  const code = req.body['code'] || ''
  const method = lodash.get(req, 'session.pageData.twoFactorAuthMethod', secondFactorMethod.APP)

  if (!code) {
    lodash.set(req, 'session.pageData.configureTwoFactorAuthMethodRecovered', {
      errors: {
        verificationCode: 'Enter a verification code'
      }
    })
    return res.redirect(paths.user.profile.twoFactorAuth.configure)
  }

  try {
    await userService.configureNewOtpKey(req.user.externalId, code, method, req.correlationId)
    req.flash('otpMethodUpdated', method)
    return res.redirect(paths.user.profile.index)
  } catch (err) {
    if (err instanceof RESTClientError && (err.errorCode === 401 || err.errorCode === 400)) {
      lodash.set(req, 'session.pageData.configureTwoFactorAuthMethodRecovered', {
        errors: {
          verificationCode: 'The verification code you’ve used is incorrect or has expired'
        }
      })
      return res.redirect(paths.user.profile.twoFactorAuth.configure)
    } else {
      next(err)
    }
  }
}
