'use strict'

const lodash = require('lodash')

const paths = require('../../../paths')
const userService = require('../../../services/user.service.js')
const secondFactorMethod = require('../../../models/second-factor-method')
const { RESTClientError } = require('../../../errors')
const { validateOtp } = require('../../../utils/validation/server-side-form-validations')
const { validationErrors } = require('../../../utils/validation/field-validation-checks')
const { sanitiseSecurityCode } = require('../../../utils/security-code-utils')

module.exports = async function postUpdateSecondFactorMethod (req, res, next) {
  const code = sanitiseSecurityCode(req.body.code)
  const method = lodash.get(req, 'session.pageData.twoFactorAuthMethod', secondFactorMethod.APP)

  const validationResult = validateOtp(code)
  if (!validationResult.valid) {
    lodash.set(req, 'session.pageData.configureTwoFactorAuthMethodRecovered', {
      errors: {
        securityCode: validationResult.message
      }
    })
    return res.redirect(paths.user.profile.twoFactorAuth.configure)
  }

  try {
    await userService.configureNewOtpKey(req.user.externalId, code, method)
    req.flash('otpMethodUpdated', method)
    return res.redirect(paths.user.profile.index)
  } catch (err) {
    if (err instanceof RESTClientError && (err.errorCode === 401 || err.errorCode === 400)) {
      const error = method === secondFactorMethod.SMS
        ? validationErrors.invalidOrExpiredSecurityCodeSMS
        : validationErrors.invalidOrExpiredSecurityCodeApp
      lodash.set(req, 'session.pageData.configureTwoFactorAuthMethodRecovered', {
        errors: {
          securityCode: error
        }
      })
      return res.redirect(paths.user.profile.twoFactorAuth.configure)
    } else {
      next(err)
    }
  }
}
