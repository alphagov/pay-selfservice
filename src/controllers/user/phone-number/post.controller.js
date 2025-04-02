'use strict'

const { response } = require('../../../utils/response')
const userService = require('../../../services/user.service')
const paths = require('../../../paths')
const { invalidTelephoneNumber } = require('../../../utils/telephone-number-utils')
const { validationErrors } = require('../../../utils/validation/field-validation-checks')
const lodash = require('lodash')

module.exports = async function updatePhoneNumber (req, res, next) {
  const telephoneNumber = req.body.phone
  if (invalidTelephoneNumber(telephoneNumber)) {
    const pageData = {
      telephoneNumber,
      errors: {
        phone: validationErrors.invalidTelephoneNumber
      }
    }
    return response(req, res, 'team-members/edit-phone-number', pageData)
  }

  try {
    // todo: check with current phone number and redirect to index for no change
    await userService.updatePhoneNumber(req.user.externalId, telephoneNumber)
    await userService.provisionNewOtpKey(req.user.externalId)
    await userService.sendProvisionalOTP(req.user.externalId)

    lodash.set(req, 'session.pageData.twoFactorAuthMethod', 'SMS')
    return res.redirect(paths.user.profile.twoFactorAuth.configure)
  } catch (err) {
    next(err)
  }
}
