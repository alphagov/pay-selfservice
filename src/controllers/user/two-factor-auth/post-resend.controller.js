'use strict'

const userService = require('../../../services/user.service.js')
const paths = require('../../../paths')
const { invalidTelephoneNumber } = require('../../../utils/telephone-number-utils')
const { validationErrors } = require('../../../utils/validation/field-validation-checks')
const { response } = require('../../../utils/response')

module.exports = async function resendSmsCode (req, res, next) {
  const { phone } = req.body
  if (invalidTelephoneNumber(phone)) {
    const pageData = {
      phone,
      errors: {
        phone: validationErrors.invalidTelephoneNumber
      }
    }
    return response(req, res, 'two-factor-auth/resend-sms-code', pageData)
  }

  try {
    await userService.updatePhoneNumber(req.user.externalId, phone)
    await userService.sendProvisionalOTP(req.user.externalId)
    req.flash('generic', 'Another security code has been sent to your phone')
    return res.redirect(paths.user.profile.twoFactorAuth.configure)
  } catch (err) {
    next(err)
  }
}
