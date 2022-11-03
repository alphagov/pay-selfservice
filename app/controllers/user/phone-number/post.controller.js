'use strict'

const { response } = require('../../../utils/response')
const userService = require('../../../services/user.service')
const paths = require('../../../paths')
const { invalidTelephoneNumber } = require('../../../utils/telephone-number-utils')
const { validationErrors } = require('../../../utils/validation/field-validation-checks')

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
    await userService.updatePhoneNumber(req.user.externalId, telephoneNumber)

    req.flash('generic', 'Phone number updated')
    return res.redirect(paths.user.profile.index)
  } catch (err) {
    next(err)
  }
}
