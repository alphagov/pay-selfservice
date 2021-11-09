'use strict'

const { response } = require('../../../utils/response')
const userService = require('../../../services/user.service')
const paths = require('../../../paths')
const { invalidTelephoneNumber } = require('../../../utils/telephone-number-utils')

module.exports = async function updatePhoneNumber (req, res, next) {
  const telephoneNumber = req.body.phone
  if (invalidTelephoneNumber(telephoneNumber)) {
    const pageData = {
      telephoneNumber,
      errors: {
        phone: 'Invalid telephone number. Enter a telephone number, like 01632 960 001, 07700 900 982 or +44 0808 157 0192'
      }
    }
    return response(req, res, 'team-members/edit-phone-number', pageData)
  }

  try {
    await userService.updatePhoneNumber(req.user.externalId, telephoneNumber, req.correlationId)

    req.flash('generic', 'Phone number updated')
    return res.redirect(paths.user.profile.index)
  } catch (err) {
    next(err)
  }
}
