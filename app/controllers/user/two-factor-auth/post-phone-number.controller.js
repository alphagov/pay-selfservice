'use string'

const { response } = require('../../../utils/response')
const paths = require('../../../paths')
const { invalidTelephoneNumber } = require('../../../utils/telephone-number-utils')
const { validationErrors } = require('../../../utils/validation/field-validation-checks')
const userService = require('../../../services/user.service')

module.exports = async function submitPhoneNumber (req, res, next) {
  const { phone } = req.body
  if (invalidTelephoneNumber(phone)) {
    const pageData = {
      phone,
      errors: {
        phone: validationErrors.invalidTelephoneNumber
      }
    }
    return response(req, res, 'two-factor-auth/phone-number', pageData)
  }

  try {
    await userService.updatePhoneNumber(req.user.externalId, phone)
    await userService.provisionNewOtpKey(req.user.externalId)
    await userService.sendProvisionalOTP(req.user.externalId)
    return res.redirect(paths.user.profile.twoFactorAuth.configure)
  } catch (err) {
    next(err)
  }
}
